import Web3 from 'web3'
import * as dotenv from 'dotenv'
import {describe, expect, test} from '@jest/globals';
import {Gateway} from "./gateway";

dotenv.config()

const privateKey = process.env.PRIVATE_KEY || ''

// MainNet
const rpcUrl = 'https://api.harmony.one'
const contractAddress = ''

const waitTimeout = 10000

let gateway: Gateway;

beforeAll(() => {
  const provider = new Web3.providers.HttpProvider(rpcUrl)
  gateway = new Gateway({ provider, contractAddress, privateKey })
  console.log('Test account address: ', gateway.accountAddress)
})

describe('Gateway', () => {
  test('Check rental price', async () => {
    const price = await gateway.getPrice('artem', '0x95D02e967Dd2D2B1839347e0B84E59136b11A073')
    expect(price).toBe('100000000000000000000')
  });
});