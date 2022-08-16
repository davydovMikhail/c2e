import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import * as mocha from "mocha-steps";
import { parseEther } from '@ethersproject/units';
import { Create2Earn } from '../typechain-types';

describe('$CTE TEST', async () => {
    let token: Create2Earn;
    let admin: SignerWithAddress;
    let controller: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let user4: SignerWithAddress;
    let user5: SignerWithAddress;
    let excluded1: SignerWithAddress;
    let excluded2: SignerWithAddress;
    let excluded3: SignerWithAddress;
    let excluded4: SignerWithAddress;
    let excluded5: SignerWithAddress;
    let taxRecipient1: SignerWithAddress;
    let taxRecipient2: SignerWithAddress;
    let taxRecipient3: SignerWithAddress;
    let taxRecipient4: SignerWithAddress;
    let taxRecipient5: SignerWithAddress;

    const taxValues = [
        1,
        3,
        2,
        1,
        3
    ]

    const totalCTE = 1000_000_000;

    beforeEach(async () => {
        [
            admin, controller, 
            user1, user2, user3, user4, user5, 
            excluded1, excluded2, excluded3, excluded4, excluded5,
            taxRecipient1, taxRecipient2, taxRecipient3, taxRecipient4, taxRecipient5
        ] = await ethers.getSigners();
    });

    mocha.step("Deploy $CTE", async function () {
        const C2E = await ethers.getContractFactory("Create2Earn");
        const name = 'Create to Earn token';
        const symbol = 'CTE';
        token = await C2E.connect(admin).deploy(name, symbol, parseEther(totalCTE.toString()));
    });

    mocha.step("Check simple view functions", async function () {
        expect(await token.name()).eq('Create to Earn token');
        expect(await token.symbol()).eq('CTE');
        expect(await token.decimals()).eq(18);
        expect(await token.totalSupply()).eq(parseEther(totalCTE.toString()));
    });

    mocha.step("Transfer token without tax's recipients", async function () {
        await token.connect(admin).transfer(user1.address, parseEther('1000000')); 
        await token.connect(admin).transfer(user2.address, parseEther('1000000')); 
        await token.connect(admin).transfer(user3.address, parseEther('1000000')); 
    });

    mocha.step("Check full balance after transfer without tax's recipients", async function () {
        expect(await token.balanceOf(user1.address)).eq(parseEther('1000000'));
        expect(await token.balanceOf(user2.address)).eq(parseEther('1000000'));
        expect(await token.balanceOf(user3.address)).eq(parseEther('1000000'));
    });

    mocha.step("Checking hasRole function", async function () {
        await expect(token.connect(user1).excludeFromFee(excluded1.address)).to.be.revertedWith("You don't have access rights.");
        await expect(token.connect(user1).addTaxRecipient(5, taxRecipient1.address)).to.be.revertedWith("You don't have access rights.");
        await expect(token.connect(user1).removeTaxRecipient(0, taxRecipient1.address)).to.be.revertedWith("You don't have access rights.");
        await expect(token.connect(user1).setNewTaxValue(0, taxRecipient1.address, 5)).to.be.revertedWith("You don't have access rights.");
        await expect(token.connect(user1).setNewRecipient(1, taxRecipient1.address, taxRecipient2.address)).to.be.revertedWith("You don't have access rights.");
    });

    mocha.step("Checking access control when assigning a user to a role", async function () {
        await expect(token.connect(user1).grantRole((await token.TOKEN_CONTROL_ROLE()), controller.address)).to.be.revertedWith(`AccessControl: account ${user1.address.toLowerCase()} is missing role ${(await token.ADMIN_ROLE()).toLowerCase()}`);
    });

    mocha.step("Assigning a user to a role TOKEN_CONTROL_ROLE", async function () {
        await token.connect(admin).grantRole((await token.TOKEN_CONTROL_ROLE()), controller.address);
    });

    mocha.step("Adding excluded from fee addresses", async function () {
        await token.connect(controller).excludeFromFee(excluded1.address);
        await token.connect(controller).excludeFromFee(excluded2.address);
        await token.connect(controller).excludeFromFee(excluded3.address);
        await token.connect(controller).excludeFromFee(excluded4.address);
        await token.connect(controller).excludeFromFee(excluded5.address);
    });

    mocha.step("Check excluded addresses by true/false", async function () {
        expect(await token.excludedFromFee(excluded1.address)).eq(true);
        expect(await token.excludedFromFee(excluded2.address)).eq(true);
        expect(await token.excludedFromFee(excluded3.address)).eq(true);
        expect(await token.excludedFromFee(excluded4.address)).eq(true);
        expect(await token.excludedFromFee(excluded5.address)).eq(true);
        expect(await token.excludedFromFee(user1.address)).eq(false);        
    });

    mocha.step("Adding tax's recipients", async function () {
        await token.connect(controller).addTaxRecipient(taxValues[4], taxRecipient4.address)
        await token.connect(controller).addTaxRecipient(taxValues[1], taxRecipient2.address)
        await token.connect(controller).addTaxRecipient(taxValues[2], taxRecipient3.address)
        await token.connect(controller).addTaxRecipient(taxValues[3], taxRecipient4.address)
        await token.connect(controller).addTaxRecipient(taxValues[4], taxRecipient5.address)
    });

    mocha.step("Check some requires", async function () {
        await expect(token.connect(controller).removeTaxRecipient(0, taxRecipient1.address)).to.be.revertedWith("Invalid recipient address.");
        await expect(token.connect(controller).removeTaxRecipient(5, taxRecipient4.address)).to.be.revertedWith("ID does not exist.");
        await expect(token.connect(controller).setNewTaxValue(4, taxRecipient1.address, 1)).to.be.revertedWith("Invalid recipient address.");
        await expect(token.connect(controller).setNewTaxValue(5, taxRecipient5.address, 1)).to.be.revertedWith("ID does not exist.");
        await expect(token.connect(controller).setNewRecipient(3, taxRecipient3.address, taxRecipient1.address)).to.be.revertedWith("Invalid recipient address.");
        await expect(token.connect(controller).setNewRecipient(5, taxRecipient4.address, taxRecipient1.address)).to.be.revertedWith("ID does not exist.");
    });

    mocha.step('Setting new tax value', async function () {
        await token.connect(controller).setNewTaxValue(4, taxRecipient5.address, 1);
    });

    mocha.step('Setting new recipient', async function () {
        await token.connect(controller).setNewRecipient(3, taxRecipient4.address, taxRecipient1.address);
    });

    mocha.step("Check last identifier after adding recipients", async function () {
        expect(await token.getLastTaxIdentifier()).eq(4);
    });

    mocha.step("Removing tax's recipients", async function () {
        await token.connect(controller).removeTaxRecipient(0, taxRecipient4.address);
        await token.connect(controller).removeTaxRecipient(1, taxRecipient2.address);
    }); 

    mocha.step("Check last identifier after removing 2 recipients", async function () {
        expect(await token.getLastTaxIdentifier()).eq(2);
    });

    mocha.step("Check taxes array", async function () {
        expect((await token.taxes(0)).tax).eq(1);        
        expect((await token.taxes(1)).tax).eq(taxValues[3]);        
        expect((await token.taxes(2)).tax).eq(taxValues[2]);       
        expect((await token.taxes(0)).recipient).eq(taxRecipient5.address);        
        expect((await token.taxes(1)).recipient).eq(taxRecipient1.address);        
        expect((await token.taxes(2)).recipient).eq(taxRecipient3.address);        
    });

    mocha.step("Removing all tax's recipients", async function () {
        await token.connect(controller).removeTaxRecipient(2, taxRecipient3.address);
        await token.connect(controller).removeTaxRecipient(1, taxRecipient1.address);
        await token.connect(controller).removeTaxRecipient(0, taxRecipient5.address);
    });

    mocha.step("Check last identifier after removing all recipients", async function () {
        expect(await token.getLastTaxIdentifier()).eq(0);
    });

    mocha.step("Adding tax's recipient again", async function () {
        await token.connect(controller).addTaxRecipient(taxValues[0], taxRecipient1.address)
        await token.connect(controller).addTaxRecipient(taxValues[1], taxRecipient2.address)
        await token.connect(controller).addTaxRecipient(taxValues[2], taxRecipient3.address)
        await token.connect(controller).addTaxRecipient(taxValues[3], taxRecipient4.address)
        await token.connect(controller).addTaxRecipient(taxValues[4], taxRecipient5.address)
    });

    mocha.step("Transfer token with taxes", async function () {
        await token.connect(user1).transfer(user4.address, parseEther('10000'));
    });

    mocha.step("Checking different balances after transfer with taxes", async function () {
        expect(await token.balanceOf(user4.address)).eq(parseEther('9000'));
        expect(await token.balanceOf(taxRecipient1.address)).eq(parseEther((10000*taxValues[0]/100).toString()));
        expect(await token.balanceOf(taxRecipient2.address)).eq(parseEther((10000*taxValues[1]/100).toString()));
        expect(await token.balanceOf(taxRecipient3.address)).eq(parseEther((10000*taxValues[2]/100).toString()));
        expect(await token.balanceOf(taxRecipient4.address)).eq(parseEther((10000*taxValues[3]/100).toString()));
        expect(await token.balanceOf(taxRecipient5.address)).eq(parseEther((10000*taxValues[4]/100).toString()));
    });

    mocha.step("Transfer tokens to excluded address", async function () {
        await token.connect(user2).transfer(excluded1.address, parseEther('10000'));
    });

    mocha.step("Transfer tokens from excluded address", async function () {
        await token.connect(excluded1).transfer(user5.address, parseEther('5000'));
    });

    mocha.step("Transfer tokens from excluded address to excluded address", async function () {
        await token.connect(excluded1).transfer(excluded2.address, parseEther('2500'));
    });

    mocha.step("Checking balances after transfers for excluded addresses", async function () {
        expect(await token.balanceOf(excluded1.address)).eq(parseEther('2500'));
        expect(await token.balanceOf(excluded2.address)).eq(parseEther('2500'));
        expect(await token.balanceOf(user5.address)).eq(parseEther('5000'));
    });

});