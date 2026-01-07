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

                stage('Determine Active Tag') {
                        steps {
                                sh '''
                                    if [ -f ${ACTIVE_FILE} ]; then
                                        cat ${ACTIVE_FILE} > .current_tag
                                    else
                                        echo green > .current_tag
                                    fi

                                    if [ "$(cat .current_tag)" = "green" ]; then
                                        echo blue > .next_tag
                                    else
                                        echo green > .next_tag
                                    fi
                                '''
                        }
                }

                stage('Prepare Tag') {
                        steps {
                                script {
                                        env.TAG = readFile('.next_tag').trim()
                                        echo "Deploying tag: ${env.TAG}"
                                }
                        }
                }

        stage('Build Docker Images') {
            steps {
                sh "TAG=${env.TAG} docker compose -f ${COMPOSE_FILE} build"
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                sh "TAG=${env.TAG} docker compose -f ${COMPOSE_FILE} push"
            }
        }

        stage('Deploy Application') {
            steps {
                sh "TAG=${env.TAG} docker compose -f ${COMPOSE_FILE} down || true"
                sh "TAG=${env.TAG} docker compose -f ${COMPOSE_FILE} up -d"
            }
        }

        stage('Verify and Switch') {
            steps {
                script {
                    try {
                        sh '''
                          for i in $(seq 1 30); do
                            if curl -sSf http://localhost:3000/health; then
                              echo "healthy" && exit 0
                            fi
                            sleep 2
                          done
                          exit 1
                        '''

                        writeFile file: "${ACTIVE_FILE}", text: "${env.TAG}"
                        echo "Switched active tag to ${env.TAG}"
                    } catch (err) {
                        echo "Health check failed. Rolling back..."
                        def prev = readFile('.current_tag').trim()
                        sh "TAG=${prev} docker compose -f ${COMPOSE_FILE} up -d"
                        error "Deployment failed and rolled back to ${prev}"
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