import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import {AttributeType, BillingMode, TableEncryption} from '@aws-cdk/aws-dynamodb';
import * as appsync from '@aws-cdk/aws-appsync';
import {AuthorizationType} from '@aws-cdk/aws-appsync';
import * as iam from '@aws-cdk/aws-iam';
import {join} from "path";

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * Create a DynamoDB table to hold our application data. For our demo, this is a single peice of pricing information.
     * I'm leaving the key names intentionally opaque named as the intention is to use this one
     * table for any and all application data for our website. If this were a real app, I would be using
     * techniques discussed in this re:invent talk (https://www.youtube.com/watch?v=HaEPXoXVf2k).
     * Jump to 22:45 for an accelerated course in NoSQL modeling.
     */
    const ddbTable = new dynamodb.Table(this, `APIDataTable`, {
      tableName: 'APIDataTable',
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.DEFAULT,
      partitionKey: {
        name: 'hk',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING
      }
    })

    const accessRole = new iam.Role(this, 'APIAccessRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
      inlinePolicies: {
        DDBAccess: iam.PolicyDocument.fromJson({
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "APIAccessDynamoDB",
              "Effect": "Allow",
              "Action": [
                "dynamodb:*"
              ],
              "Resource": [ddbTable.tableArn]
            }
          ]
        })
      }
    })

    const api = new appsync.GraphqlApi(this, 'AppSyncAPI', {
      name: 'CryptoTickerAPI',
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY
        }
      },
      schema: new appsync.Schema({filePath: join(__dirname, '../schema.graphql')})
    })

    const dynamoDBDataSource = new appsync.DynamoDbDataSource(this,  'DDBTableDataSource', {
      api,
      name: `APIDDBTable`,
      serviceRole: accessRole,
      table: ddbTable
    })

    const priceDataSource = new appsync.HttpDataSource(this, 'PriceDataSource', {
      api,
      name: 'PricesAPI',
      endpoint: 'https://api.coingecko.com',
      description: "Use coingecko's API to get price data for free."
    })
    const getPriceFunction = new appsync.AppsyncFunction(this, 'GetPriceFunction', {
      api,
      dataSource: priceDataSource,
      name: 'GetPriceForTicker',
      // AppSync HTTP resolvers must pass the path as part of the resolver and not the data source.
      // We configure a GET request to coin gecko to get the price of our token.
      requestMappingTemplate: appsync.MappingTemplate.fromString(`\
      {
          "version": "2018-05-29",
          "method": "GET",
          "resourcePath": "/api/v3/simple/price?ids=\${ctx.stash.get("ticker")}&vs_currencies=usd"
      }`),
      // We parse the result body as JSON and then pluck out the object under the $ctx.args.ticker field to format it like we expect.
      // $ctx.result looks like `{ "bitcoin": { "usd": 50000 } }` and we want `{ "usd": 50000 }`
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($bodyContent = $util.parseJson($ctx.result.body))
        $util.toJson($bodyContent.get("$ctx.args.ticker"))
      `)
    })
    const putPriceFunction = new appsync.AppsyncFunction(this, 'PutPriceFunction', {
      api,
      dataSource: dynamoDBDataSource,
      name: 'PutPriceHistoryForTicker',
      // AppSync HTTP resolvers must pass the path as part of the resolver and not the data source.
      // We configure a GET request to coin gecko to get the price of our token.
      requestMappingTemplate: appsync.MappingTemplate.fromString(`\
      #set($now = $util.time.nowISO8601())
      {
        "version" : "2018-05-29",
        "operation" : "PutItem",
        "key": {
            "hk": $util.dynamodb.toDynamoDBJson($ctx.stash.get("ticker")),
            "sk": $util.dynamodb.toDynamoDBJson("price_$now")
        },
        "attributeValues" : {
          "ticker": $util.dynamodb.toDynamoDBJson($ctx.stash.get("ticker")),
          "timestamp": $util.dynamodb.toDynamoDBJson($now),
          "priceUSD": $util.dynamodb.toDynamoDBJson($ctx.prev.result.usd)
        }
      }`),
      // We parse the result body as JSON and then pluck out the object under the $ctx.args.ticker field to format it like we expect.
      // $ctx.result looks like `{ "bitcoin": { "usd": 50000 } }` and we want `{ "usd": 50000 }`
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson($ctx.prev.result)
      `)
    })
    const priceResolver = new appsync.Resolver(this, 'QueryTickerResolver', {
      api,
      pipelineConfig: [getPriceFunction, putPriceFunction],
      fieldName: 'ticker',
      typeName: 'Query',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`\
      $util.qr($ctx.stash.put("ticker", "$ctx.args.ticker"))
      {}
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`{
        "ticker": "$ctx.args.ticker",
        "latestPrice": $util.toJson($ctx.prev.result)
      }`)
    })
    const historicalPricesResolver = new appsync.Resolver(this, 'HistoricalPriceResolver', {
      api,
      fieldName: 'priceHistory',
      typeName: 'TickerInfo',
      dataSource: dynamoDBDataSource,
      requestMappingTemplate: appsync.MappingTemplate.fromString(`{
        "version" : "2018-05-29",
        "operation" : "Query",
        "query" : {
            "expression" : "#hk=:hk",
            "expressionNames" : {
                "#hk" : "hk"
            },
            "expressionValues" : {
                ":hk": { "S": "$ctx.source.ticker" }
            }
        },
        "scanIndexForward" : false,
        "limit": $util.defaultIfNull($ctx.args.limit, 25),
        
        #if (!$util.isNullOrEmpty($ctx.args.nextToken))
          "nextToken": $util.defaultIfNullOrEmpty($ctx.args.nextToken, "")
        #end
      }`),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`$util.toJson($ctx.result)`)
    })
  }
}
