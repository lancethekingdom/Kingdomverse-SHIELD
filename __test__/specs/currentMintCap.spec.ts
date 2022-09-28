import { deployShieldToken } from '../utils/deploySheildToken'
import { expect, assert } from 'chai'
import { ethers } from 'hardhat'
import Chance from 'chance'
import { SafeMath } from '../utils/safeMath'
import { BigNumber } from 'ethers'
const chance = new Chance()

describe('UNIT TEST: Shield Token - currentMintCap', () => {
  it('should return initial mintable per period when just deployed', async () => {
    const [token] = await deployShieldToken()
    const initialMintablePerPeriod = await token.INITIAL_MINTABLE_PER_PERIOD()
    const currentMintCap = await token.currentMintCap()

    expect(currentMintCap).to.equal(initialMintablePerPeriod)
  })
  it('should return n times halved initialMintablePerPeriod amount after n halving period passed', async () => {
    const [token] = await deployShieldToken()

    const initialMintablePerPeriod = await token.INITIAL_MINTABLE_PER_PERIOD()

    const halvingPeriod = (await token.HALVING_PERIOD()).toNumber()
    const numberOfPeriodPassed = chance.integer({ min: 1, max: 100 })

    const provider = ethers.provider

    await provider.send('evm_increaseTime', [
      SafeMath.mul(numberOfPeriodPassed, halvingPeriod),
    ])
    await provider.send('evm_mine', [])
    
    const currentMintCap = await token.currentMintCap()

    expect(
      initialMintablePerPeriod.div(
        BigNumber.from(2).pow(BigNumber.from(numberOfPeriodPassed)),
      ),
    ).to.equal(currentMintCap)
  })
})
