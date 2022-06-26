//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "./Recovery.sol";

interface IERC20 {
    function approve(address _spender, uint _value) external returns (bool success);
    // function allowance(address _owner, address _spender) external view returns (uint remaining);
}

contract Factory {
  mapping (address => address) public recoveryContracts;

  function createRecoveryContract(bytes32 _hashedPassword) external returns (address recoveryContractAddress) {
    // require(recoveryContracts[msg.sender] == address(0), "Recovery Contract Exists");
    recoveryContractAddress = address(new Recovery(_hashedPassword));
    recoveryContracts[msg.sender] = recoveryContractAddress;
    return recoveryContractAddress;
  }

  function setAllowances(address[] memory tokenAddresses, uint[] memory amounts) public {
    for (uint i = 0; i < tokenAddresses.length; i++) {
      IERC20(tokenAddresses[i]).approve(recoveryContracts[msg.sender], amounts[i]);
    }
  }
}
