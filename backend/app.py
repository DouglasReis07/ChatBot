# backend/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente
load_dotenv()

app = Flask(__name__)
CORS(app) # Habilita o CORS para permitir requisições do frontend

# Configura a API key do Gemini
try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    model = genai.GenerativeModel('gemini-1.5-flash-latest') # Use o modelo que funcionou para você
except Exception as e:
    print(f"Erro ao configurar a API do Gemini: {e}")
    model = None

# Define a rota da API para o chat
@app.route('/chat', methods=['POST'])
def chat():
    if model is None:
        return jsonify({"error": "Modelo de IA não foi inicializado corretamente."}), 500

    # Pega a mensagem e o histórico do corpo da requisição JSON
    data = request.json
    user_message = data.get('message')
    history_raw = data.get('history', [])

    if not user_message:
        return jsonify({"error": "Nenhuma mensagem fornecida."}), 400

    # Reconstrói o histórico para o formato da API
    # A API espera um formato: [{'role': 'user'/'model', 'parts': [text]}]
    history = []
    for item in history_raw:
        role = 'user' if item['sender'] == 'user' else 'model'
        history.append({'role': role, 'parts': [item['text']]})

    try:
        # Inicia o chat com o histórico fornecido
        chat_session = model.start_chat(history=history)

        # Envia a nova mensagem do usuário
        response = chat_session.send_message(user_message)

        # Retorna a resposta do modelo como JSON
        return jsonify({"reply": response.text})

    except Exception as e:
        print(f"Erro ao se comunicar com a API Gemini: {e}")
        return jsonify({"error": "Ocorreu um erro ao processar sua mensagem."}), 500

# Roda o servidor Flask
if __name__ == '__main__':
    app.run(debug=True, port=5000)