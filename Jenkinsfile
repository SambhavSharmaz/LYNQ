pipeline {
  agent any
  environment {
    DOCKER_BUILDKIT = '1'
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Build') {
      steps {
        script {
          if (isUnix()) {
            sh 'docker compose build --no-cache'
          } else {
            bat 'docker compose build --no-cache'
          }
        }
      }
    }
    stage('Deploy') {
      steps {
        script {
          if (isUnix()) {
            sh 'docker compose up -d'
          } else {
            bat 'docker compose up -d'
          }
        }
      }
    }
  }
}
