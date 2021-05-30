import json
import boto3
import cv2
import numpy as np
import json
from urllib.parse import unquote_plus
import time
from os import listdir

def lambda_handler(event, context):
    key = event['Records'][0]['s3']['object']['key']
    etag = event['Records'][0]['s3']['object']['eTag']
    etag = '"{}"'.format(etag)
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    user_identity = event['Records'][0]['userIdentity']['principalId']
    key = unquote_plus(key)
    s3_client = boto3.client('s3')
    db_client = boto3.client('dynamodb')
    table_name = 'imageDB'

    # load yolo3
    yolo_bucket = 'imageyolo' 
    weight_yolo3 = s3_client.get_object(Bucket=yolo_bucket, Key='yolov3.weights')
    config_yolo3 = s3_client.get_object(Bucket=yolo_bucket, Key='yolov3.cfg')
    coco_yolo3 = s3_client.get_object(Bucket=yolo_bucket, Key='coco.names')
    labels = coco_yolo3['Body'].read().decode('utf8').strip().split('\n')
    
    # download image
    image_tmp_path = '/tmp/' + key.split('/')[-1]
    s3_client.download_file(Bucket = bucket_name, Key = key, Filename = image_tmp_path)

    # read image
    nparray = cv2.imread(image_tmp_path)
    load_yolov3 = cv2.dnn.readNetFromDarknet(config_yolo3['Body'].read(), weight_yolo3['Body'].read())
    yolo_layer_name = load_yolov3.getLayerNames()
    yolo_layer_name = [yolo_layer_name[i[0] - 1] for i in load_yolov3.getUnconnectedOutLayers()]
    blob = cv2.dnn.blobFromImage(nparray, 1 / 255.0, (416, 416), swapRB=True, crop=False)
    load_yolov3.setInput(blob)
    start_time = time.time()
    compute_image = load_yolov3.forward(yolo_layer_name)
    end = time.time()
    detection_result_list = []
    confidence_list = []
    getclass_list = []
    for output in compute_image:
        for detection in output:
            scores = detection[5:]
            getclass = np.argmax(scores)

            confidence = scores[getclass]
            if confidence > 0.15:

                confidence_list.append(float(confidence))
                getclass_list.append(getclass)
                
    for i in range(len(getclass_list)):
        detection_result = labels[getclass_list[i]]
        detection_result_list.append(detection_result)
    detection_result_list = list(set(detection_result_list))
    print(detection_result_list)

    item = {}
    list_tags = []
    for tag in detection_result_list:
        tag_item = {}
        tag_item["S"] = tag
        list_tags.append(tag_item)
    print(list_tags)

    item['tags'] = {"L" : list_tags}
    item['etag'] = {"S" : etag}
    item['user'] = {"S" : user_identity}

    response = db_client.put_item(TableName = table_name, Item = item)
    return response
