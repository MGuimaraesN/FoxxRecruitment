# 🚀 Decola Vagas

<div align="center">
  <img src="frontend/public/decola-vagas-logo.png" alt="Decola Vagas Logo" width="120" />

  <h1>Decola Vagas</h1>
  <h3>O Hub Definitivo de Oportunidades Académicas e Profissionais</h3>

  <p>
    <a href="#sobre">Sobre</a> •
    <a href="#funcionalidades">Funcionalidades</a> •
    <a href="#tecnologias">Tecnologias</a> •
    <a href="#como-executar">Como Executar</a> •
    <a href="#licenca">Licença</a>
  </p>
</div>

---

## 📋 Sobre o Projeto {#sobre}

O **Decola Vagas** é uma plataforma full‑stack criada para resolver a fragmentação de oportunidades no meio acadêmico. Ela centraliza **estágios, IC, emprego e trainee** em um único ambiente, conectando diretamente alunos, docentes, coordenações e empresas.

Diferente de murais físicos e grupos desorganizados, o Decola Vagas oferece:

* Gestão completa de candidaturas
* Notificações automáticas por e‑mail
* Perfis profissionais completos
* Painel administrativo avançado

---

## 📸 Screenshots

<div align="center">
  <img src="./images/dashboard.png" alt="Dashboard Preview" />
  <img src="./images/admin_dashboard.png" alt="Admin Preview" />
</div>

---

## ✨ Funcionalidades {#funcionalidades}

O sistema utiliza **RBAC (Role‑Based Access Control)** permitindo diferentes acessos conforme o perfil do usuário.

### 🎓 Alunos

* Mural inteligente com filtros avançados
* Candidatura em 1 clique
* Histórico e gestão de carreira
* Favoritos
* Notificações por e‑mail

### 🏢 Recrutadores (Empresas / Professores)

* Criação e gestão de vagas com editor rico
* Pipeline de seleção (Aprovar / Rejeitar / Análise)
* Triagem otimizada e download de currículos
* Feedback automático aos candidatos

### 🛡️ Administradores

* Dashboard analítico
* Multi‑instituição
* Controle completo de permissões
* Auditoria de atividades

---

## 🛠️ Tecnologias Utilizadas {#tecnologias}

### **Monorepo**

Organização unificada com tipagem consistente.

### **Frontend – /frontend**

* Next.js 15 (App Router)
* TypeScript
* Tailwind CSS + Shadcn/UI
* React Context API
* React Quill
* Sonner Notifications
* Lucide Icons

### **Backend – /backend**

* Node.js + Express.js
* TypeScript
* Prisma ORM
* MySQL 8.0
* Autenticação JWT + Bcrypt
* Multer (uploads)
* Nodemailer (SMTP Gmail)
* Node‑Cron (tarefas agendadas)

### **Infra – /database**

* Docker + Docker Compose
* phpMyAdmin

---

## 🚀 Como Executar {#como-executar}

### **Pré‑requisitos**

* Node.js v20+
* Docker Desktop (opcional)
* Git

### **1. Clonar o Repositório**

```bash
git clone https://github.com/MGuimaraesN/Decola-Vagas.git
cd Decola-Vagas
```

### **2. Configurar Variáveis de Ambiente**

```bash
cd backend
cp .env.example .env
```

⚠️ Configure as credenciais do Gmail (`GMAIL_USER`, `GMAIL_APP_PASS`).

### **3. Instalar Dependências e Configurar Ambiente**

```bash
npm run install:all
```

Ou manualmente:

```bash
npm install
npm install --prefix frontend
npm install --prefix backend

docker-compose up -d
cd backend
npx prisma migrate dev
npx prisma db seed
```

### **4. Rodar o Projeto**

```bash
npm run dev
```

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend: [http://localhost:5000](http://localhost:5000)
* phpMyAdmin: [http://localhost:3310](http://localhost:3310)

---

## 🧪 Dados de Teste (Seed)

| Perfil      | E-mail                                                | Senha  |
| ----------- | ----------------------------------------------------- | ------ |
| Super Admin | [superadmin@decola.com](mailto:superadmin@decola.com) | 123456 |
| Admin Inst. | [admin@decola.com](mailto:admin@decola.com)           | 123456 |
| Empresa     | [recrutador@tech.com](mailto:recrutador@tech.com)     | 123456 |
| Aluno       | [aluno@decola.com](mailto:aluno@decola.com)           | 123456 |

---

## 📂 Estrutura do Projeto

```
Decola-Vagas/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── services/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── context/
└── database/
```

---

## 🤝 Contribuição

Contribuições são bem‑vindas!

1. Fork o projeto
2. Crie uma branch (`feature/minha-feature`)
3. Commit → `git commit -m "Add: Minha feature"`
4. Push → `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## 📄 Licença {#licenca}

Este projeto está sob a licença **MIT**.

<div align="center">
  Desenvolvido com 💙 por <a href="https://github.com/MGuimaraesN">Mateus Guimarães</a>
</div>
