import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('image_db')


def lambda_handler(event, context):
    # parse out query string para
    body = event["body"]
    url = json.loads(body)["url"]

    # initialse response
    response = {}

    # delete elements from db
    table.delete_item(
        Key={
            "url": url
        }
    )

    # delete file from s3
    BUCKET_NAME = "5225-image-upload-bucket"
    filename = url.split(".com/")[1]
    s3 = boto3.resource("s3")
    s3.Object(BUCKET_NAME, filename).delete()

    # construct body of response object
    response["status"] = "done"
    print("ok")

    # construct http object
    response_object = {}
    response_object["statusCode"] = 200
    response_object["headers"] = {'Content-Type': 'application/json'}
    response_object["body"] = json.dumps(response)

    # return
    return response_object
