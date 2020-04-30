# Conformity Profile Management Tools

## Apply multiple profiles to multiple accounts

Use this command to combine multiple Profiles into one Master Profile and apply it to many accounts.
This script requires [Node.js 12.x](https://nodejs.org/en/download/) or newer.

```shell script
Usage: npx cloudconformity/tools-profile-management apply [options]

Options:
  -V, --version                                      output the version number
  -k, --api-key <API Key>                            Conformity API key
  -d, --debug                                        Enable debug logging
  -r, --region <us-west-2|ap-southeast-2|eu-west-1>  Conformity service region (default: "us-west-2")
  -e, --api-endpoint <Endpoint URL>                  Optional Conformity API endpoint (overrides region) e.g. https://us-west-2-api.cloudconformity.com
  -p, --profiles <Profile IDs>                       Comma-separated Profile IDs to be applied to accounts
  -a, --accounts <Account IDs>                       Comma-separated Target Account IDs
  -n, --notes <Profile Apply Notes>                  Notes to use when applying Profiles
  -m, --master-profile-id <Master Profile ID>        Optional Master Profile ID. If not set, a new Master Profile is created.
  -h, --help                                         display help for command
```

Example:

```shell script
npx cloudconformity/tools-profile-management#OP-724 \
  apply \
  --api-key [REDACTED] \
  --api-endpoint https://us-west-2-api.cloudconformity.com \
  --accounts uruKXcw7N,wD952RJ9A,T-rxV0lnk \
  --profiles F8N3oSAp,S9JmsXT0,QTl39hZK \
  --notes "Master Profile applied"

# output:
  npx: installed 73 in 15.934s
  info: Applying 3 Profiles to 3 Accounts
  info: Loading 3 Profiles
  info: Merging Profiles
  info: Merged 3 Profiles including 529 Rule Settings to a Master Profile including 528 Rule Settings
  info: Saving Master Profile
  info: Applying Profile [id=za2zTvnQ-] to 3 Accounts
  info: Profiles were applied successfully
```

You can reuse the created Master Profile in subsequent commands by passing its ID in `--master-profile-id ...` command-line argument, or from Conformity web interface.

