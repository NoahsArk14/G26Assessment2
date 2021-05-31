import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('image_db')


def lambda_handler(event, context):
    # parse out query string para
    body = event["body"]
    outside = json.loads(body)
    url = outside["url"]
    tags_outside = outside["tags"]

    tags_outside = list(set(tags_outside))

    # response
    response = {}

    # get existing data
    existing_tags = table.get_item(
        Key={
            "url": url
        })["Item"]["tags"]

    print(existing_tags)

    update_tags = existing_tags + tags_outside

    # add tags to object
    table.update_item(
        Key={
            'url': url,
        },
        UpdateExpression="SET tags= :var1",
        ExpressionAttributeValues={
            ':var1': update_tags,
        },
        ReturnValues="UPDATED_NEW"
    )

    response["status"] = "done"

    # construct http object
    response_object = {}
    response_object["statusCode"] = 200
    response_object["headers"] = {'Content-Type': 'application/json'}
    response_object["body"] = json.dumps(response)

    # return
    return response_object