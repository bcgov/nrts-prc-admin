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
    stage('Checkout Code') {
      checkout scm
    }
    stage('Exeucte Sonar') {
      dir('sonar-runner') {
        try {
          sh 'npm install typescript && ./gradlew sonarqube -Dsonar.host.url=https://sonarqube-prc-tools.pathfinder.gov.bc.ca -Dsonar.verbose=true --stacktrace --info'
        } catch(e) {
          echo "Sonar: Failed: ${e}"
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
  stages {
    stage('Building: admin (master branch)') {
      steps {
        script {
          try {
            echo "Building: env.JOB_NAME=${env.JOB_NAME} env.BUILD_ID=${env.BUILD_ID}"
            notifyBuild("Building: ${env.JOB_NAME} #${env.BUILD_ID}", "YELLOW")
            openshiftBuild bldCfg: 'admin-angular-on-nginx-master-build-angular-app-build', showBuildLogs: 'true'
          } catch (e) {
            notifyBuild("BUILD ${env.JOB_NAME} #${env.BUILD_ID} ABORTED", "RED")
            error("Building: Failed: ${e}")
          }
          echo "Building: Success"
        }
      }
    }
    stage('Deploying: admin (master branch)') {
      steps {
        script {
          try {
            echo "Deploying: env.JOB_NAME=${env.JOB_NAME} env.BUILD_ID=${env.BUILD_ID}"
            notifyBuild("Deploying: ${env.JOB_NAME} #${env.BUILD_ID}", "YELLOW")
            openshiftBuild bldCfg: 'admin-angular-on-nginx-master-build', showBuildLogs: 'true'
          } catch (e) {
            notifyBuild("BUILD ${env.JOB_NAME} #${env.BUILD_ID} ABORTED", "RED")
            error("Deploying: Failed: ${e}")
          }
          echo "Deploying: Success"
          notifyBuild("Deployed ${env.JOB_NAME} #${env.BUILD_ID}", "GREEN")
        }
      }
    }
  }
}

def notifyBuild(String msg = '', String colour = 'GREEN') {
  if (colour == 'YELLOW') {
    colorCode = '#FFFF00'
  } else if (colour == 'GREEN') {
    colorCode = '#00FF00'
  } else {
    colorCode = '#FF0000'
  }

  // Send notifications
  rocketSend (channel: 'acrfd', message: msg, rawMessage: true)
}
