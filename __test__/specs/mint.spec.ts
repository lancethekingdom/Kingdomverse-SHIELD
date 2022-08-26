import { deployShieldToken } from '../utils/deploySheildToken'
import { expect, assert } from 'chai'
import { ethers } from 'hardhat'
import { UnitParser } from '../utils/UnitParser'
import Chance from 'chance'
import { SafeMath } from '../utils/safeMath'
import { BigNumber } from 'ethers'
const chance = new Chance()

describe('UNIT TEST: Shield Token - mint', () => {
  it('should throw error if contract is paused', async () => {
    const [owner] = await ethers.getSigners()
    const [token, , authSigner] = await deployShieldToken({ owner })

    await token.connect(owner).pause()

    const paused = await token.paused()

    const msgHash = ethers.utils.solidityKeccak256(
      ['address', 'address', 'uint256', 'uint256'],
      [token.address, owner.address, UnitParser.toEther(10), 1],
    )
    const sig = await authSigner.signMessage(msgHash)

    expect(paused).to.be.true

    return token
      .connect(owner)
      .mint(owner.address, 0, 0, sig)
      .then(() => assert.fail())
      .catch((err: any) => {
        assert.include(err.message, 'Pausable: paused')
      })
  })

  it('should mint corresponding amount of token to the target address', async () => {
    const [owner, authSigner, target] = await ethers.getSigners()
    const [token] = await deployShieldToken({ owner, authSigner })

    const mintAmount = chance.integer({ min: 1, max: 100 })

    const msgHash = ethers.utils.solidityKeccak256(
      ['address', 'address', 'uint256', 'uint256'],
      [token.address, owner.address, UnitParser.toEther(mintAmount), 1],
    )

    const authedSig = await authSigner.signMessage(ethers.utils.arrayify(msgHash))

    const balanceBefore = await token.balanceOf(target.address)

    await token
      .connect(owner)
      .mint(target.address, UnitParser.toEther(mintAmount), 1, authedSig)

    const balanceAfter = await token.balanceOf(target.address)

    expect(balanceAfter).to.be.greaterThan(balanceBefore)
  })
})
