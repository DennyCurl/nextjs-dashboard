#!/bin/bash

echo "🧪 Тестування API drug-administrations"
echo "======================================"

# Функція для тестування API endpoint
test_api() {
    local url=$1
    local description=$2
    
    echo
    echo "📋 $description"
    echo "🔗 URL: $url"
    echo "📄 Відповідь:"
    
    response=$(curl -s "$url" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "$response" | head -c 200
        if [ ${#response} -gt 200 ]; then
            echo "... (обрізано)"
        fi
    else
        echo "❌ Помилка підключення до API"
    fi
    echo
    echo "---"
}

# Перевірка чи сервер запущений
echo "🔍 Перевірка доступності сервера..."
if curl -s "http://localhost:3001" > /dev/null 2>&1; then
    echo "✅ Сервер доступний на localhost:3001"
else
    echo "❌ Сервер недоступний. Переконайтесь що npm run dev запущено."
    exit 1
fi

# Тестування різних endpoints
test_api "http://localhost:3001/api/drug-administrations" "Всі видачі медикаментів (останні 100)"
test_api "http://localhost:3001/api/drug-administrations?visitId=1" "Видачі для візиту #1"
test_api "http://localhost:3001/api/drug-administrations?patientId=1" "Видачі для пацієнта #1"

echo "🏁 Тестування завершено!"
echo
echo "💡 Для детального тестування відкрийте:"
echo "   http://localhost:3001/test-drug-administrations.html"