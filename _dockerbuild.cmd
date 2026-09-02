@echo off
setlocal
set OUT=%~dp0_dockerbuild_out.txt
set AWS_PROFILE=gosoft-daniel
set AWS_REGION=us-east-1
set REGISTRY=367764689490.dkr.ecr.us-east-1.amazonaws.com
set IMAGE=%REGISTRY%/gosoft-feliz-api:latest
cd /d "%~dp0"

echo === ECR LOGIN === > "%OUT%"
aws ecr get-login-password --profile %AWS_PROFILE% --region %AWS_REGION% | docker login --username AWS --password-stdin %REGISTRY% >> "%OUT%" 2>&1
echo LOGIN_EXIT=%errorlevel% >> "%OUT%"

echo === DOCKER BUILD === >> "%OUT%"
docker build -f apps/api/Dockerfile -t %IMAGE% . >> "%OUT%" 2>&1
echo BUILD_EXIT=%errorlevel% >> "%OUT%"

echo === DOCKER PUSH === >> "%OUT%"
docker push %IMAGE% >> "%OUT%" 2>&1
echo PUSH_EXIT=%errorlevel% >> "%OUT%"

echo DONE >> "%OUT%"
endlocal
