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

    mocha.step("Transfer token", async function () {

    });
});