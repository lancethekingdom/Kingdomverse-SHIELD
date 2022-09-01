// contracts/King.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// import "hardhat/console.sol";

contract Shield is ERC20, Pausable, Ownable, ERC20Burnable {
    uint256 public constant RESERVE = 2000000 ether;
    // temp: half year in seconds
    uint256 public constant HALVING_PERIOD = 15552000;
    uint256 public constant INITIAL_MINTABLE_PER_PERIOD = 2000000000 ether;
    uint256 public immutable deployTime;
    address public authSigner;
    mapping(uint256 => uint256) periodicMinted;
    mapping(uint256 => bool) usedMintNonces;

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
    }

    function burnFrom(address account, uint256 amount) public override {
        _requireNotPaused();
        super.burnFrom(account, amount);
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
        address _minter,
        uint256 _amount,
        uint256 _nonce,
        bytes memory sig
    ) internal view returns (bool) {
        bytes32 msgHash = prefixed(
            keccak256(
                abi.encodePacked(
                    _methodIdentifier,
                    address(this),
                    _minter,
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
    ) public {
        require(!usedMintNonces[_nonce], "Nonce consumed");
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

        usedMintNonces[_nonce] = true;
        _mint(_to, _amount);
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
}
