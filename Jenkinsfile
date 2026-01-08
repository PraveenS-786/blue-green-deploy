pipeline {
    agent any

     environment {
            DOCKERHUB_CREDENTIALS = 'dockerhub-creds'
            DOCKERHUB_USERNAME = 'ramyasree15'
            COMPOSE_FILE = 'docker-compose.yml'
            ACTIVE_FILE = '.active_tag'
}

    stages {

        stage('Checkout Source Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/ramyasree1505/inventory_management_devOps.git'
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDENTIALS}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                      echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh "docker compose -f ${COMPOSE_FILE} build"
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                sh '''
                  docker compose -f ${COMPOSE_FILE} push
                '''
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                  docker compose -f ${COMPOSE_FILE} down
                  docker compose -f ${COMPOSE_FILE} up -d
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline executed successfully.'
        }
        failure {
            echo 'Pipeline execution failed.Check for failure.'
        }
    }
}
