import { deployShieldToken } from '../utils/deploySheildToken'
import { expect, assert } from 'chai'
import { ethers } from 'hardhat'
import { UnitParser } from '../utils/UnitParser'
import Chance from 'chance'
import { formatEther } from 'ethers/lib/utils'
const chance = new Chance()

describe('UNIT TEST: Shield Token - withdraw', () => {
  it('should throw error if contract is paused', async () => {
    const [owner, authSigner, target] = await ethers.getSigners()
    const [token] = await deployShieldToken({ owner, authSigner })

    const withdraw = chance.integer({ min: 1, max: 100 })

    const msgHash = ethers.utils.solidityKeccak256(
      ['string', 'address', 'address', 'uint256', 'uint256'],
      [
        'withdraw(uint256,address,uint256,bytes)',
        token.address,
        owner.address,
        UnitParser.toEther(withdraw),
        1,
      ],
    )

    const authedSig = await authSigner.signMessage(
      ethers.utils.arrayify(msgHash),
    )

    await token.connect(owner).pause()

    const paused = await token.paused()

    expect(paused).to.be.true

    return token
      .connect(owner)
      .withdraw(UnitParser.toEther(withdraw), 1, authedSig)
      .then(() => assert.fail())
      .catch((err: any) => {
        console.log('err.gessamge: ', err.message)
        assert.include(err.message, 'Pausable: paused')
      })
  })

  it('should withdraw corresponding amount of token to the target address from owner balance', async () => {
    const [owner, authSigner, target] = await ethers.getSigners()
    const [token] = await deployShieldToken({ owner, authSigner })

    const withdrawAmount = chance.integer({ min: 1, max: 100 })

    const msgHash = ethers.utils.solidityKeccak256(
      ['string', 'address', 'address', 'uint256', 'uint256'],
      [
        'withdraw(uint256,address,uint256,bytes)',
        token.address,
        target.address,
        UnitParser.toEther(withdrawAmount),
        1,
      ],
    )

    const authedSig = await authSigner.signMessage(
      ethers.utils.arrayify(msgHash),
    )

    const ownerBalanceBefore = await token.balanceOf(owner.address)
    const targetbalanceBefore = await token.balanceOf(target.address)

    await token
      .connect(target)
      .withdraw(UnitParser.toEther(withdrawAmount), 1, authedSig)

    const ownerBalanceAfter = await token.balanceOf(owner.address)
    const targetbalanceAfter = await token.balanceOf(target.address)

    expect(targetbalanceAfter).to.be.greaterThan(targetbalanceBefore)
    expect(ownerBalanceAfter).to.be.lessThan(ownerBalanceBefore)
    expect(Number(formatEther(ownerBalanceBefore.sub(ownerBalanceAfter)))).to.equal(
      withdrawAmount,
    )
  })
})
