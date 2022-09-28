import { deployShieldToken } from '../utils/deploySheildToken'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import Chance from 'chance'
import { SafeMath } from '../utils/safeMath'
const chance = new Chance()

describe('UNIT TEST: Shield Token - currentPeriod', () => {
  it('should return zero when just deployed', async () => {
    const [token] = await deployShieldToken()
    const currentPeriod = await token.currentPeriod()

    expect(currentPeriod).to.equal(0)
  })
  it('should return correct number of period after certain period of time', async () => {
    const [token] = await deployShieldToken()

    const halvingPeriod = (await token.HALVING_PERIOD()).toNumber()
    const numberOfPeriodPassed = chance.integer({ min: 1, max: 100 })

    await ethers.provider.send('evm_increaseTime', [
      SafeMath.mul(numberOfPeriodPassed, halvingPeriod),
    ])
    await ethers.provider.send('evm_mine', [])

    const currentPeriod = await token.currentPeriod()
    expect(currentPeriod).to.equal(numberOfPeriodPassed)
  })
})
