pipeline {
    agent any

    environment {
        REGISTRY = "localhost:5000"
        IMAGE = "${REGISTRY}/myapp:latest"
        CREDS = credentials('nexus-creds')
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'master', url: 'https://github.com/AnUrAg13ui/CryptoNotify_project.git'
            }
        }

        stage('Build & Push Image') {
            steps {
                sh """
                echo ${CREDS_PSW} | docker login ${REGISTRY} -u ${CREDS_USR} --password-stdin
                docker build -t ${IMAGE} .
                docker push ${IMAGE}
                """
            }
        }

        stage('Deploy on Same EC2') {
            steps {
                sh """
                docker login ${REGISTRY} -u ${CREDS_USR} -p ${CREDS_PSW}
                docker pull ${IMAGE}
                docker stop app || true
                docker rm app || true
                docker run -d --name app -p 80:3000 ${IMAGE}
                """
            }
        }
    }
}
