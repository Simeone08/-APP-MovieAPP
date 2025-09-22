# 🎬 MovieApp - Seu Catálogo Pessoal de Filmes

<div align="center">

![MovieApp Logo](https://via.placeholder.com/200x200/E50914/FFFFFF?text=🎬)

**Um aplicativo React Native elegante para descobrir, organizar e agendar seus filmes favoritos**

[![React Native](https://img.shields.io/badge/React%20Native-0.72+-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[🚀 Começar](#-instalação) • [📱 Features](#-features) • [🏗️ Arquitetura](#️-arquitetura) • [📖 Documentação](#-documentação) • [🤝 Contribuir](#-contribuindo)

</div>

---

## ✨ Features

### 🏠 **Descoberta de Filmes**
- 📈 **Filmes Populares** com scroll infinito
- 🔍 **Busca Inteligente** com debounce e histórico
- 🎯 **Filtros Avançados** por gênero, ano e avaliação
- ⭐ **Informações Detalhadas** com sinopse e avaliações

### ❤️ **Gestão Pessoal**
- ✅ **Status de Filmes**: "Já Assisti" ou "Quero Assistir"
- 📊 **Estatísticas Pessoais** e análise de hábitos
- 🏆 **Top Rated** dos seus filmes favoritos
- 💾 **Backup/Restore** automático dos dados

### ⏰ **Sistema de Lembretes**
- 📅 **Agendamento Inteligente** de filmes
- 🔔 **Integração com Calendário** nativo
- ⏰ **Notificações Personalizadas**
- 📱 **Lembretes no Smartphone**

### 🎨 **Interface Premium**
- 🌙 **Design Dark Mode** cinematográfico
- 🎬 **Tema Netflix-inspired** elegante
- 📱 **Totalmente Responsivo** iOS/Android
- ✨ **Animações Suaves** e micro-interações

---

## 📱 Screenshots

<div align="center">

| Home | Detalhes | Favoritos | Lembretes |
|------|----------|-----------|-----------|
| ![Home](https://via.placeholder.com/200x400/1a1a1a/E50914?text=🏠%0AHome) | ![Details](https://via.placeholder.com/200x400/1a1a1a/E50914?text=📖%0ADetalhes) | ![Favorites](https://via.placeholder.com/200x400/1a1a1a/E50914?text=❤️%0AFavoritos) | ![Reminders](https://via.placeholder.com/200x400/1a1a1a/E50914?text=⏰%0ALembretes) |

</div>

---

## 🚀 Instalação

### 📋 Pré-requisitos

```bash
# Verificar versões
node --version    # >= 16.0.0
npm --version     # >= 8.0.0
react-native --version  # >= 0.72.0
```

### 🔧 Setup do Projeto

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/movieapp.git
cd movieapp

# 2. Instale as dependências
npm install

# 3. Configure a API do TMDB
cp .env.example .env
# Edite o .env com sua API key do TMDB

# 4. Para iOS (macOS apenas)
cd ios && pod install && cd ..

# 5. Execute o projeto
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

### 🔑 Configuração da API

1. Acesse [TMDB API](https://www.themoviedb.org/settings/api)
2. Crie uma conta e gere sua API Key
3. Configure no arquivo `.env`:

```env
TMDB_API_KEY=sua_api_key_aqui
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_LANG=pt-BR
```

---

## 🏗️ Arquitetura

### 📁 Estrutura do Projeto

```
src/
├── 📱 components/          # Componentes reutilizáveis
│   ├── MovieCard.js       # Card de filme
│   ├── MovieDetailModal.js # Modal de detalhes
│   ├── ReminderModal.js   # Modal de lembretes
│   └── UtilityComponents.js # Loading, Error, etc.
├── 🧭 router/         # Configuração de navegação
