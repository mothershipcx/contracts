# Mothership Token

## Preamble
This report was drafted by BlockchainLabs.nz for the purpose of providing feedback to Mothership.cx. It has subsequently been shared publicly without any express or implied warranty.

BlockchainLabs.nz were involved in the development and review of the the contracts for MSP token issuance and the crowdsale, as such our review is of the contracts and not the broader Mothership.cx project.

Solidity contracts were developed and subsequently published in the Github repo [mothershipcx/contracts](https://github.com/mothershipcx/contracts/) - we would encourage all community members and token holders to make their own assessment of the contracts.

## Scope
All Solidity code contained in [/contracts](https://github.com/mothershipcx/contracts/tree/master/contracts) was considered in scope along with the tests contained in [/test](https://github.com/mothershipcx/contracts/tree/master/test) as a basis for static and dynamic analysis.

## Focus Areas
This report is focused on the following key areas - though this is *not an exhaustive list*.

### Correctness
* No correctness defects uncovered during static analysis?
* No implemented contract violations uncovered during execution?
* No other generic incorrect behavior detected during execution?
* Adherence to adopted standards such as ERC20?

### Testability
* Test coverage across all functions and events?
* Test cases for both expected behaviour and failure modes?
* Settings for easy testing of a range of parameters?
* No reliance on nested callback functions or console logs?
* Avoidance of test scenarios calling other test scenarios?

### Security
* No presence of known security weaknesses?
* No funds at risk of malicious attempts to withdraw/transfer?
* No funds at risk of control fraud?
* Prevention of Integer Overflow or Underflow?

### Best Practice
* Explicit labeling for the visibility of functions and state variables?
* Proper management of gas limits and nested execution?
* Latest version of the Solidity compiler?

## Classification

### Defect Severity
* **Minor** - A defect that does not have a material impact on the contract execution and is likely to be subjective.
* **Moderate** - A defect that could impact the desired outcome of the contract execution in a specific scenario.
* **Major** - A defect that impacts the desired outcome of the contract execution or introduces a weakness that may be exploited.
* **Critical** - A defect that presents a significant security vulnerability or failure of the contract across a range of scenarios.

## Findings
### Minor
_No minor defects were found during this audit._

### Moderate

**Constructor made public** - Prior to commit [10152600e8a0afde5a55e8f131196310390e3b2c](https://github.com/mothershipcx/contracts/commit/10152600e8a0afde5a55e8f131196310390e3b2c) the `Contribution` function was incorrectly named `MothershipContribution`. This typo inadvertently made the function public, meaning anyone would have the ability to 'unpause' the contribution contract. This was identified and fixed promptly.

### Major

**Short Address** - The current implementation of MiniMeToken is vulnerable to ERC20 Short Address 'Attack'

http://vessenes.com/the-erc20-short-address-attack-explained/
https://blog.golemproject.net/how-to-find-10m-by-just-reading-blockchain-6ae9d39fcd95

While this isn't a critical issue as it only comes into play with user error, we suggest making the fix as a modifier in the MiniMeToken contract itself.

A simple fix would be to add a modifier to check address size, and apply this modifier to the transfer function of the MiniMeToken:
```
    modifier onlyPayloadSize(uint size) {
       assert(msg.data.length == size + 4);
       _;
    }

    function transfer(address _to, uint256 _value) onlyPayloadSize(2 * 32) {
      //function body unchanged
    }
```

### Critical
_No critical defects were found during this audit._

## Conclusion
Overall we have been satisfied with the quality of the code and the level of restraint in adding any custom code other that what is *absolutely necessary*. As a result, this project is largely reusing well tested code that has been used in prior crowdsales.

There was good test coverage of the core components and additional tests were developed to improve the testability of the project as a whole.
