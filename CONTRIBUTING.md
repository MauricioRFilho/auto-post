# Contributing to Cadence Auto-Post

First off, thank you for considering contributing to Cadence Auto-Post! It's people like you that make this tool great.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the [Issues](https://github.com/MauricioRFilho/auto-post/issues) section.
- If not, create a new issue using the **Bug Report** template.
- Include as much detail as possible: steps to reproduce, environment info, and logs.

### Suggesting Enhancements

- Open a new issue using the **Feature Request** template.
- Describe the feature, why it's useful, and how it should work.

### Pull Requests

1. **Fork** the repository.
2. Create a new branch: `git checkout -b feature/my-new-feature` or `git checkout -b fix/my-bug-fix`.
3. Make your changes following the [Coding Standards](#coding-standards).
4. **Test** your changes.
5. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m 'feat: add support for new marketplace'`.
6. Push to the branch: `git push origin feature/my-new-feature`.
7. Open a **Pull Request** against the `main` branch.

## Coding Standards

### Backend (NestJS)
- Follow the official [NestJS coding style](https://docs.nestjs.com/).
- Use TypeScript and keep types strict.
- Run linting: `cd backend && npm run lint`.

### Dashboard (Next.js)
- Use functional components and hooks.
- Use Tailwind CSS and shadcn/ui components.
- Run linting: `cd dashboard && npm run lint`.

### Scraper (Python)
- Follow PEP 8.
- Use type hints wherever possible.
- Document classes and methods with docstrings.

## Project Structure

- `backend/`: NestJS API.
- `dashboard/`: Next.js web interface.
- `scraper/`: Python worker for product scraping.
- `n8n/`: n8n workflow files.
- `docker/`: Dockerfiles for each service.

---

# Contribuindo para o Cadence Auto-Post

Antes de tudo, obrigado por considerar contribuir para o Cadence Auto-Post! São pessoas como você que tornam esta ferramenta incrível.

## Código de Conduta

Ao participar deste projeto, você concorda em seguir nosso [Código de Conduta](CODE_OF_CONDUCT.md).

## Como Posso Contribuir?

### Relatando Bugs

- Verifique se o bug já foi relatado na seção de [Issues](https://github.com/MauricioRFilho/auto-post/issues).
- Se não, crie uma nova issue usando o template de **Bug Report**.
- Inclua o máximo de detalhes possível: passos para reproduzir, informações do ambiente e logs.

### Sugerindo Melhorias

- Abra uma nova issue usando o template de **Feature Request**.
- Descreva a funcionalidade, por que ela é útil e como ela deve funcionar.

### Pull Requests

1. Faça um **Fork** do repositório.
2. Crie uma nova branch: `git checkout -b feature/minha-nova-feature` ou `git checkout -b fix/meu-bug-fix`.
3. Faça suas alterações seguindo os [Padrões de Código](#padrões-de-código).
4. **Teste** suas alterações.
5. Comite suas alterações usando [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m 'feat: add support for new marketplace'`.
6. Dê um push para a branch: `git push origin feature/minha-nova-feature`.
7. Abra um **Pull Request** para a branch `main`.

## Padrões de Código

### Backend (NestJS)
- Siga o [estilo de código oficial do NestJS](https://docs.nestjs.com/).
- Use TypeScript e mantenha os tipos rigorosos.
- Execute o lint: `cd backend && npm run lint`.

### Dashboard (Next.js)
- Use componentes funcionais e hooks.
- Use Tailwind CSS e componentes shadcn/ui.
- Execute o lint: `cd dashboard && npm run lint`.

### Scraper (Python)
- Siga a PEP 8.
- Use type hints sempre que possível.
- Documente classes e métodos com docstrings.

## Estrutura do Projeto

- `backend/`: API NestJS.
- `dashboard/`: Interface web Next.js.
- `scraper/`: Worker Python para scraping de produtos.
- `n8n/`: Arquivos de workflow do n8n.
- `docker/`: Dockerfiles para cada serviço.
