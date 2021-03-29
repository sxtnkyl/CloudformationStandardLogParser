## Goal

For use with low traffic websites. Can be used to locally store logs and keep S3 buckets decluttered.
Parse Cloudfront standard logs for valid JSON objects, sort into folders by date,
and create two compiled jsons (bots and unique viewers) for a month's folder.

_NOTE: compile by bots and unique viewers currently separate_

### Setup

- AWS create credentials profile
- Connect to aws toolkit
  *https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/connect.html*
- Set global credentials file
- Set global config file
  *https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/global-config-object.html*
- Dotenv file should contain KEYID, SECRET, REGION, BUCKET

### Javascript

#### **index.js**

Creates a folder in working directory by date(year, month, day). First arguement should be a number _keyAmount_ of files
to download from your S3 bucket, defined in dotenv. Starts by oldest file in the bucket.

_NOTE: Bucket must not have files nested in folders_

```sh
node index.js 6
```

#### **filterFolder.js**

Optional usage- takes a folder of one month and organizes logs from bots from unique viewers
into two json files (botVisitsByMonth01.json and visitorsByMonth01.json). Takes two arguements- yearand month.
Year must be 4 chars, while month is 2 chars.

```sh
node filterFolder.js 2021 02 17
```
