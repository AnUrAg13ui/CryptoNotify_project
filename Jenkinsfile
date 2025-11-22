pipeline {
    agent any

    stages {
        stage('Pull Code') {
            steps {
                git branch: 'master',
                    url: 'https://github.com/AnUrAg13ui/CryptoNotify_project.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t cryptopulse .'
            }
        }

        stage('Stop Old Container') {
            steps {
                sh 'docker stop cryptopulse || true'
                sh 'docker rm cryptopulse || true'
            }
        }

        stage('Run New Container') {
            steps {
                sh 'docker run -d --name cryptopulse -p 3000:3000 --env-file .env cryptopulse'
            }
        }
    }
}
