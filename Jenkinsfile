def sonarqubePodLabel = "prc-admin-${UUID.randomUUID().toString()}"
podTemplate(label: sonarqubePodLabel, name: sonarqubePodLabel, serviceAccount: 'jenkins', cloud: 'openshift', containers: [
  containerTemplate(
    name: 'jnlp',
    image: '172.50.0.2:5000/openshift/jenkins-slave-python3nodejs',
    resourceRequestCpu: '500m',
    resourceLimitCpu: '1000m',
    resourceRequestMemory: '1Gi',
    resourceLimitMemory: '4Gi',
    workingDir: '/tmp',
    command: '',
    args: '${computer.jnlpmac} ${computer.name}',
    envVars: [
      envVar(key: 'SONARQUBE_URL', value: 'https://sonarqube-prc-tools.pathfinder.gov.bc.ca')
    ]
  )
]) {
  node(sonarqubePodLabel) {
    stage('checkout code') {
      checkout scm
    }
    stage('exeucte sonar') {
      dir('sonar-runner') {
        try {
          sh 'npm install typescript && ./gradlew sonarqube -Dsonar.host.url=https://sonarqube-prc-tools.pathfinder.gov.bc.ca -Dsonar.verbose=true --stacktrace --info'
        } finally {

        }
      }
    }
  }
}

pipeline {
  agent any
  options {
    skipDefaultCheckout()
  }
  environment {
    // this credential needs to exist in Jenkins (https://jenkins.io/doc/book/using/using-credentials)
    // and should contain the RocketChat Integration Token (https://rocket.chat/docs/administrator-guides/integrations/)
    ROCKETCHAT_WEBHOOK_TOKEN = credentials('rocketchat_incoming_webhook_token')
  }
  stages {
    stage('Building: admin (master branch)') {
      steps {
        script {
          try {
            notifyBuild("Building: ${env.JOB_NAME} ${env.BUILD_ID}", "YELLOW")
            echo "Building: env.JOB_NAME=${env.JOB_NAME} env.BUILD_ID=${env.BUILD_ID}"
            openshiftBuild bldCfg: 'admin-angular-on-nginx-master-build-angular-app-build', showBuildLogs: 'true'
          } catch (e) {
            notifyBuild("BUILD ${env.JOB_NAME} ${env.BUILD_ID} FAILED", "RED")
            error("Building: Failed: ${e}")
          }
          notifyBuild("Built ${env.JOB_NAME} ${env.BUILD_ID}", "GREEN")
          echo "Building: Success"
        }
      }
    }
    stage('Deploying: admin (master branch)') {
      steps {
        script {
          try {
            notifyBuild("Deploying: ${env.JOB_NAME} ${env.BUILD_ID}", "YELLOW")
            echo "Deploying: env.JOB_NAME=${env.JOB_NAME} env.BUILD_ID=${env.BUILD_ID}"
            openshiftBuild bldCfg: 'admin-angular-on-nginx-master-build', showBuildLogs: 'true'
          } catch (e) {
            notifyBuild("DEPLOYMENT ${env.JOB_NAME} ${env.BUILD_ID} FAILED", "RED")
            error("Deploying: Failed: ${e}")
          }
          notifyBuild("Deployed ${env.JOB_NAME} ${env.BUILD_ID}", "GREEN")
          echo "Deploying: Success"
        }
      }
    }
  }
}

def notifyBuild(String msg = '', String colour = '') {
  if (colour == 'GREEN') {
    colorCode = '#00FF00'
  } else if (colour == 'YELLOW') {
    colorCode = '#FFFF00'
  } else if (colour == 'RED') {
    colorCode = '#FF0000'
  } else {
    colorCode = '#000000' // black
  }

  String rocketChatMessage = "{ \"attachments\": [{ \"text\":\"${msg}\", \"color\":\"${colorCode}\" }] }"

  String rocketChatWebHookURL = "https://chat.pathfinder.gov.bc.ca/hooks/${ROCKETCHAT_WEBHOOK_TOKEN}"

  // Send notifications to RocketChat
  try {
    sh "curl -X POST -H 'Content-type: application/json' --data '${rocketChatMessage}' ${rocketChatWebHookURL}"
  } catch (e) {
    echo "Notify: Failed: ${e}"
  }
}
