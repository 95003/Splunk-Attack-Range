import boto3
import os
import json

ec2 = boto3.client("ec2")
ssm = boto3.client("ssm")

# Controller machine where attack_range.py runs
CONTROLLER_INSTANCE_ID = os.environ.get("CONTROLLER_INSTANCE_ID", "i-0d7844a0b6e1d84f6")

# Which tag to filter on (Key=OS, Value=linux/windows)
TARGET_TAG_KEY = os.environ.get("TARGET_TAG_KEY", "OS")

def lambda_handler(event, context):
    try:
        # Parse body (API Gateway or direct invoke)
        body = event.get("body")
        if body and isinstance(body, str):
            body = json.loads(body)
        elif not body:
            body = event  

        attack_id = body.get("attack_id")
        server_type = body.get("server_type")   # linux / windows

        if not server_type or not attack_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Payload must include 'server_type' and 'attack_id'"})
            }

        # 🔎 Find EC2 instances with tag OS=server_type
        reservations = ec2.describe_instances(
            Filters=[
                {"Name": f"tag:{TARGET_TAG_KEY}", "Values": [server_type]},
                {"Name": "instance-state-name", "Values": ["running"]}
            ]
        )["Reservations"]

        if not reservations or not reservations[0]["Instances"]:
            return {
                "statusCode": 404,
                "body": json.dumps({"error": f"No running instance found with tag {TARGET_TAG_KEY}={server_type}"})
            }

        # Pick first matching instance
        instance = reservations[0]["Instances"][0]

        # Get Name tag (attack_range expects instance name, not EC2 ID)
        tags = instance.get("Tags", [])
        name_tag = next((tag["Value"] for tag in tags if tag["Key"] == "Name"), None)

        if not name_tag:
            return {
                "statusCode": 404,
                "body": json.dumps({"error": "Instance has no 'Name' tag"})
            }

        target_instance_name = name_tag

        # Build attack command (using Name, not ID)
        command = f"cd /home/ubuntu/attack_range && python attack_range.py simulate --target {target_instance_name} --simulation {attack_id}"

        # Send command to Controller via SSM
        response = ssm.send_command(
            Targets=[{"Key": "InstanceIds", "Values": [CONTROLLER_INSTANCE_ID]}],
            DocumentName="AWS-RunShellScript",
            Parameters={"commands": [command]}
        )

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": f"✅ Triggered attack {attack_id} on {server_type} instance ({target_instance_name})",
                "command_id": response["Command"]["CommandId"]
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
