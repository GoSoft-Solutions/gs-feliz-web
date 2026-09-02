@echo off
setlocal
set OUT=%~dp0_deploy_eb_out.txt
set AWS_PROFILE=gosoft-daniel
set AWS_REGION=us-east-1
set IMAGE=367764689490.dkr.ecr.us-east-1.amazonaws.com/gosoft-feliz-api:latest
set APP=gosoft-feliz-eb-app
set ENVNAME=gosoft-feliz-eb-env-api-prod
set DEPLOYBUCKET=gosoft-feliz-eb-deploy-prod
set VERSION=cors-%RANDOM%%RANDOM%
set BUNDLE=%~dp0_ebbundle
cd /d "%~dp0"

echo === PREP BUNDLE === > "%OUT%"
if exist "%BUNDLE%" rmdir /s /q "%BUNDLE%"
mkdir "%BUNDLE%"
powershell -NoProfile -Command "(Get-Content '%~dp0Dockerrun.aws.json.template') -replace '__IMAGE_URI__', '%IMAGE%' | Set-Content -Encoding ascii '%BUNDLE%\Dockerrun.aws.json'" >> "%OUT%" 2>&1
type "%BUNDLE%\Dockerrun.aws.json" >> "%OUT%" 2>&1

echo === ZIP === >> "%OUT%"
powershell -NoProfile -Command "Compress-Archive -Path '%BUNDLE%\Dockerrun.aws.json' -DestinationPath '%~dp0_ebdeploy.zip' -Force" >> "%OUT%" 2>&1

echo === UPLOAD S3 === >> "%OUT%"
aws s3 cp "%~dp0_ebdeploy.zip" "s3://%DEPLOYBUCKET%/%VERSION%.zip" --profile %AWS_PROFILE% --region %AWS_REGION% >> "%OUT%" 2>&1
echo UPLOAD_EXIT=%errorlevel% >> "%OUT%"

echo === CREATE APP VERSION === >> "%OUT%"
aws elasticbeanstalk create-application-version --application-name %APP% --version-label %VERSION% --source-bundle S3Bucket=%DEPLOYBUCKET%,S3Key=%VERSION%.zip --profile %AWS_PROFILE% --region %AWS_REGION% >> "%OUT%" 2>&1
echo CREATEVER_EXIT=%errorlevel% >> "%OUT%"

echo === UPDATE ENV === >> "%OUT%"
aws elasticbeanstalk update-environment --environment-name %ENVNAME% --version-label %VERSION% --profile %AWS_PROFILE% --region %AWS_REGION% >> "%OUT%" 2>&1
echo UPDATEENV_EXIT=%errorlevel% >> "%OUT%"
echo VERSION=%VERSION% >> "%OUT%"
echo DONE >> "%OUT%"
endlocal
