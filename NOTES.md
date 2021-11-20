=====

actually thinking through this I think it would be easiest for it to be a webpage that anyone can load at any time. It would work like this:

1) Go to a URL of a react app hosted on ipfs (like https://github.com/TrustlessFi/tcp-ui hosted on https://rinkeby-tcp.on.fleek.co/ )
2) connect metamask
3) view the eligible addresses that hold a Hue position with debt, view the addresses that hold a liquidity position with liquidity.

Behind the scenes the react app is using the same multicall logic and efficient fetching (tree dependency) logic that the regular ui (linked above) is

It does the following:

1) in batches of 100, fetch all positions,  from 0 to the current "next position ID". Filter by positions that have debt. (call positionsColllateralization on ProtocolDataAggregator, if it has a non-zero collateralization then it has debt)
2) See who owns each position NFT by ID (Call ownerOf on HuePositionNFT)
3) filter the list based on unique ID
4) Fetch all liquidity positions owned by each address that owns a position with debt. (call getPoolPositionNftIdsByOwner on Accounting)
5) filter the list of addresses by those that hold a liquidity position that has non-zero liquidity (call getPoolPosition on Accounting)
6) display the list of debt position owner addresses, and liquidity position owners addresses.

NOTES:
1) filtering by addresses that have sent a transaction to the blockchain in the previous year would have to happen separately, doing a join using big data query or something, or this can be potentially skipped if we think this is not worth it due to cons of excluding newbies, adding complexity outweighing the pro of preventiing spam
2) this means there is a requirement that to get liquidity mining rewards, you would need to concurrently hold a debt position. I think this is a reasonable requirement. (This makes it simple to fetch all of the liquidity positions without an external data source)
3) Anyone can view the data at any time and verify that their address is included! 

=====

I was thinking about it and there are two UIs that interact with the genesis logic infrastructure that you are building:
1) The one that pulls current data from the chain to get a list of users currently participating in genesis:
   https://discord.com/channels/776179370833870898/903387834650607618/903434180711567361
2) The one that allows someone to take a signature that is generated from your script and call GenesisAllocation.claimAllocations with the signature data.

These pieces connect as follows:
1) view the UI from 1) above to get a list of addresses
2) take those addresses and generate signatures for each of them, equally dividing a given amount of TCP between each
3) post a JSON of those signatures to IPFS
4) When a user connects to the UI from 2) above with a wallet, pull the entire JSON payload from the ipfs address above, find the user's signatures, and send a tx to GenesisAllocation.claimAllocations with all of the signatures so the user can claim their allocations. You could cache the JSONs from each subsequent round ID indefinitely in localStorage since they are immutable.

3) is an interesting take on our method before of creating an IPFS mirror of the private database, when instead we could just pull form the public immutable version and everything is completely trustless and in sync. You would have to find a way for an already deployed UI to know where it can find multiple "rounds" of signatures (each signature payload would include {sig, roundID, countTCP}) since you would need to post new rounds without updating the UI code.

If this seems not doable for whatever reason, we can discuss using the older DB method.