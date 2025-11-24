pipeline {

    agent {
        kubernetes {
            defaultContainer 'node'
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins/label: my-jenkins-jenkins-agent
spec:
  serviceAccountName: default
  containers:
  - name: node
    image: node:18
    command: ['cat']
    tty: true
    volumeMounts:
      - mountPath: "/home/jenkins/agent"
        name: "workspace-volume"

  - name: dind
    image: docker:dind
    securityContext:
      privileged: true
    command: ["dockerd-entrypoint.sh"]
    volumeMounts:
      - name: docker-graph-storage
        mountPath: /var/lib/docker

  - name: jnlp
    image: jenkins/inbound-agent:latest
    args: ['\$(JENKINS_SECRET)', '\$(JENKINS_NAME)']

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
                container('node') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                container('node') {
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
                container('dind') {
                    withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
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
        success {
            echo "🔥 Deployment Successful: CryptoNotify is Live!"
        }
        failure {
            echo "❌ Build Failed — Check Logs!"
        }
    }
}
