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
stage('Select Blue-Green Tag') {
    steps {
        sh '''
          if [ -f ${ACTIVE_FILE} ]; then
            CURRENT=$(cat ${ACTIVE_FILE})
          else
            CURRENT=green
          fi

          if [ "$CURRENT" = "green" ]; then
            echo blue > .next_tag
          else
            echo green > .next_tag
          fi
        '''
        script {
            env.TAG = readFile('.next_tag').trim()
            echo "Deploying ${env.TAG}"
        }
    }
}

       stage('Deploy Application (Blue-Green)') {
    steps {
        sh '''
          echo "Starting new version..."
          TAG=${TAG} docker compose -f ${COMPOSE_FILE} up -d
        '''
    }
}
stage('Verify & Switch') {
    steps {
        script {
            try {
                sh '''
                  for i in $(seq 1 15); do
                    curl -sf http://localhost:3000/health && exit 0
                    sleep 2
                  done
                  exit 1
                '''

                writeFile file: "${ACTIVE_FILE}", text: "${env.TAG}"
                echo "Switched traffic to ${env.TAG}"

            } catch (e) {
                echo "Health check failed, rolling back"
                sh "TAG=${env.TAG} docker compose -f ${COMPOSE_FILE} down"
                error "Deployment failed"
            }
        }
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
