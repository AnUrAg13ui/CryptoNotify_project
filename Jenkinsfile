pipeline {
    agent any

    environment {
        IMAGE_NAME = "cryptonotify"
        REGISTRY = "nexus.imcc.com:8082"
        SONARQUBE = "sonar-server"
        SONAR_TOKEN = credentials('sonar-token-2401059')
    }

    stages {

        stage('Checkout') {
            steps {
                git 'https://github.com/AnUrAg13ui/CryptoNotify_project.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv("${SONARQUBE}") {
                    sh """
                        sonar-scanner \
                        -Dsonar.projectKey=cryptonotify \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=http://sonarqube.imcc.com \
                        -Dsonar.login=$SONAR_TOKEN
                    """
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${REGISTRY}/${IMAGE_NAME}:latest ."
            }
        }

        stage('Push to Nexus') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh """
                        docker login ${REGISTRY} -u $USER -p $PASS
                        docker push ${REGISTRY}/${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                sshagent(credentials: ['server-ssh']) {
                    sh '''
                    ssh root@192.168.20.250 "
                        docker pull nexus.imcc.com:8082/cryptonotify:latest &&
                        docker stop cryptonotify || true &&
                        docker rm cryptonotify || true &&
                        docker run -d --name cryptonotify -p 3000:3000 nexus.imcc.com:8082/cryptonotify:latest
                    "
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🔥 Deployment Successful: CryptoNotify is Live!"
        }
        failure {
            echo "❌ Build Failed — Check Logs!"
        }
    }
}
