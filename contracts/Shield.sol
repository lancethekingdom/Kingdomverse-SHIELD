// contracts/King.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// import "hardhat/console.sol";

contract Shield is ERC20, Pausable, Ownable, ERC20Burnable {
    event Burn(address indexed burner, uint256 amount, uint256 currentPeriod);
    event BurnFrom(address indexed from, uint256 amount, uint256 currentPeriod);
    event Mint(
        address indexed wallet,
        address indexed to,
        uint256 amount,
        uint256 indexed nonce,
        uint256 currentPeriod
    );
    event Withdraw(
        address indexed wallet,
        uint256 amount,
        uint256 indexed nonce
    );

    uint256 public constant RESERVE = 2 ether * 10**6;
    // temp: half year in seconds
    uint256 public constant HALVING_PERIOD = 15552000;
    uint256 public constant INITIAL_MINTABLE_PER_PERIOD = 2 ether * 10**9;
    uint256 public immutable deployTime;
    address public authSigner;
    mapping(uint256 => uint256) periodicMinted;
    mapping(address => mapping(uint256 => bool)) sigNonces; // all the nonces consumed by each address

    constructor(address _authSigner) ERC20("SHIELD", "SHIELD") {
        require(_authSigner != address(0), "Invalid addr");
        authSigner = _authSigner;

        deployTime = block.timestamp;
        _mint(msg.sender, RESERVE);
        periodicMinted[0] = 0;
    }

    function splitSignature(bytes memory sig)
        internal
        pure
        returns (
            uint8,
            bytes32,
            bytes32
        )
    {
        require(sig.length == 65, "Invalid signature");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            );
    }

    function recoverSigner(bytes32 message, bytes memory sig)
        internal
        pure
        returns (address)
    {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function burn(uint256 amount) public override {
        _requireNotPaused();
        super.burn(amount);
        emit Burn(msg.sender, amount, currentPeriod());
    }

    function burnFrom(address account, uint256 amount) public override {
        _requireNotPaused();
        super.burnFrom(account, amount);
        emit BurnFrom(account, amount, currentPeriod());
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        _requireNotPaused();
    }

    function setAuthSigner(address _authSigner) external onlyOwner {
        require(_authSigner != address(0), "Invalid addr");
        authSigner = _authSigner;
    }

    function currentPeriod() public view returns (uint256) {
        return (block.timestamp - (deployTime)) / (HALVING_PERIOD);
    }

    function currentMintCap() public view returns (uint256) {
        return INITIAL_MINTABLE_PER_PERIOD / (2**currentPeriod());
    }

    function _validateHash(
        string memory _methodIdentifier,
        address _address,
        uint256 _amount,
        uint256 _nonce,
        bytes memory sig
    ) internal view returns (bool) {
        bytes32 msgHash = prefixed(
            keccak256(
                abi.encodePacked(
                    _methodIdentifier,
                    address(this),
                    _address,
                    _amount,
                    _nonce
                )
            )
        );
        return recoverSigner(msgHash, sig) == authSigner;
    }

    function mint(
        address _to,
        uint256 _amount,
        uint256 _nonce,
        bytes memory sig
    ) external {
        require(!sigNonces[_msgSender()][_nonce], "Nonce consumed");
        require(
            _validateHash(
                "mint(address,uint256,uint256,bytes)",
                msg.sender,
                _amount,
                _nonce,
                sig
            ),
            "Invalid signature"
        );

        sigNonces[_msgSender()][_nonce] = true;
        _mint(_to, _amount);
        emit Mint(_msgSender(), _to, _amount, _nonce, currentPeriod());
    }

    function _mint(address account, uint256 amount) internal virtual override {
        // check if not exceed currentMintCap
        require(
            (periodicMinted[currentPeriod()] + amount) <= currentMintCap(),
            "Exceed current mint cap"
        );

        _requireNotPaused();
        super._mint(account, amount);
    }

    function recoverERC20(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        token.transfer(owner(), token.balanceOf(address(this)));
    }

    modifier withdrawCompliance(
        uint256 amount,
        address wallet,
        uint256 nonce,
        bytes memory sig
    ) {
        _requireNotPaused();
        require(balanceOf(owner()) >= amount, "Insufficient Balance");
        require(!sigNonces[wallet][nonce], "nonce already consumed");
        require(
            _validateHash(
                "withdraw(uint256,address,uint256,bytes)",
                wallet,
                amount,
                nonce,
                sig
            ),
            "Invalid signature"
        );
        _;
    }

    function withdraw(
        uint256 amount,
        uint256 _nonce,
        bytes memory sig
    ) external withdrawCompliance(amount, _msgSender(), _nonce, sig) {
        sigNonces[_msgSender()][_nonce] = true;
        _transfer(owner(), _msgSender(), amount);
        emit Withdraw(_msgSender(), amount, _nonce);
    }
}
