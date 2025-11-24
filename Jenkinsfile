pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  hostAliases:
  - ip: "192.168.20.250"
    hostnames:
      - "sonarqube.imcc.com"

  containers:
  - name: node
    image: node:18
    command: ['cat']
    tty: true
    volumeMounts:
    - mountPath: "/home/jenkins/agent"
      name: "workspace-volume"

  - name: sonar
    image: sonarsource/sonar-scanner-cli:latest
    command: ['cat']
    tty: true
    volumeMounts:
    - mountPath: "/home/jenkins/agent"
      name: "workspace-volume"

  - name: dind
    image: docker:dind
    securityContext:
      privileged: true
    volumeMounts:
    - mountPath: "/var/lib/docker"
      name: docker-graph-storage
    - mountPath: "/home/jenkins/agent"
      name: workspace-volume

  volumes:
  - name: docker-graph-storage
    emptyDir: {}
  - name: workspace-volume
    emptyDir: {}

            """
        }
    }

    environment {
        IMAGE_NAME = "cryptonotify"
        REGISTRY = "nexus.imcc.com:8082"
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
                container('node') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                container('sonar') {
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
                container('dind') {
                    sh "docker build -t ${REGISTRY}/${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Push to Nexus') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    container('dind') {
                        sh """
                            docker login ${REGISTRY} -u $USER -p $PASS
                            docker push ${REGISTRY}/${IMAGE_NAME}:latest
                        """
                    }
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
        success { echo "🔥 Deployment Successful! CryptoNotify is Live." }
        failure { echo "❌ Build Failed — Check Logs!" }
    }
}
