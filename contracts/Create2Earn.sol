// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IERC20.sol";
import "./IERC20Metadata.sol";
import "./SafeMath.sol";

contract Create2Earn is IERC20, IERC20Metadata, AccessControl {
    using SafeMath for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TOKEN_CONTROL_ROLE =
        keccak256("TOKEN_CONTROL_ROLE");

    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    mapping(address => bool) public excludedFromFee;

    struct Tax {
        uint256 tax;
        address recipient;
    }

    Tax[] public taxes;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_, uint256 totalSupply_) {
        _name = name_;
        _symbol = symbol_;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(TOKEN_CONTROL_ROLE, msg.sender);
        _setRoleAdmin(TOKEN_CONTROL_ROLE, ADMIN_ROLE);
        _mint(msg.sender, totalSupply_);
    }

    function excludeFromFee(address _address) external {
        require(
            hasRole(TOKEN_CONTROL_ROLE, msg.sender),
            "You don't have access rights."
        );
        excludedFromFee[_address] = !excludedFromFee[_address]; 
    }

    function addTaxRecipient(uint256 _tax, address _recipient)
        external
        returns (uint256 taxID)
    {
        require(
            hasRole(TOKEN_CONTROL_ROLE, msg.sender),
            "You don't have access rights."
        );
        taxes.push(Tax({tax: _tax, recipient: _recipient}));
        taxID = taxes.length - 1;
    }

    function removeTaxRecipient(uint256 _taxID, address _recipient) external {
        require(
            hasRole(TOKEN_CONTROL_ROLE, msg.sender),
            "You don't have access rights."
        );
        require(
            taxes[_taxID].recipient == _recipient,
            "Invalid recipient address."
        );
        require(_taxID < taxes.length, "ID does not exist.");
        taxes[_taxID] = taxes[taxes.length - 1];
        taxes.pop();
    }

    function setNewTaxValue(
        uint256 _taxID,
        address _recipient,
        uint256 _tax
    ) external {
        require(
            hasRole(TOKEN_CONTROL_ROLE, msg.sender),
            "You don't have access rights."
        );
        require(
            taxes[_taxID].recipient == _recipient,
            "Invalid recipient address."
        );
        require(_taxID < taxes.length, "ID does not exist.");
        taxes[_taxID].tax = _tax;
    }

    function setNewRecipient(
        uint256 _taxID,
        address _oldRecipient,
        address _newRecipient
    ) external {
        require(
            hasRole(TOKEN_CONTROL_ROLE, msg.sender),
            "You don't have access rights."
        );
        require(
            taxes[_taxID].recipient == _oldRecipient,
            "Invalid recipient address."
        );
        require(_taxID < taxes.length, "ID does not exist.");
        taxes[_taxID].recipient = _newRecipient;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     */
    function transfer(address to, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     */
    function approve(address spender, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     */
    function increaseAllowance(address spender, uint256 addedValue)
        public
        virtual
        returns (bool)
    {
        address owner = _msgSender();
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        virtual
        returns (bool)
    {
        address owner = _msgSender();
        uint256 currentAllowance = allowance(owner, spender);
        require(
            currentAllowance >= subtractedValue,
            "ERC20: decreased allowance below zero"
        );
        unchecked {
            _approve(owner, spender, currentAllowance - subtractedValue);
        }

        return true;
    }

    /**
     * @dev Moves `amount` of tokens from `from` to `to`.
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(
            fromBalance >= amount,
            "ERC20: transfer amount exceeds balance"
        );
        unchecked {
            _balances[from] = fromBalance - amount;
        }
        uint256 _amount = amount;

        if (!excludedFromFee[from] && !excludedFromFee[to]) {
            for (uint256 i = 0; i < taxes.length; i++) {
                Tax memory tax = taxes[i];
                uint256 share = amount.div(100).mul(tax.tax);
                unchecked {
                    _balances[tax.recipient] += share;
                    _amount -= share;
                }
            }
        }

        _balances[to] += _amount;

        emit Transfer(from, to, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     */
    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     */
    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
        }
        _totalSupply -= amount;

        emit Transfer(account, address(0), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Updates `owner` s allowance for `spender` based on spent `amount`.
     */
    function _spendAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(
                currentAllowance >= amount,
                "ERC20: insufficient allowance"
            );
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
}
