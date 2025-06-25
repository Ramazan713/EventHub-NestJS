Event Hub is a short demo backend project for event management, built with [NestJS](https://nestjs.com/) and TypeScript.  
It demonstrates how to design a scalable and maintainable API for creating, managing, and publishing events, including draft support, user authentication, and payment integration.  

---

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Features

- **Event Management:** Create, update, delete, and publish events.
- **Draft Events:** Save events as drafts and publish them later, allowing organizers to prepare events before making them public.
- **User Authentication & Authorization:** JWT-based authentication with role-based access control (User, Organizer).
- **RESTful API:** Well-structured REST endpoints for all resources.
- **GraphQL API:** Includes GraphQL queries, mutations, and real-time subscriptions for event updates.
- **Stripe Integration:** Accept payments for event tickets using Stripe.
- **Pagination & Filtering:** Efficient cursor-based pagination and flexible filtering for event listings.
- **Prisma ORM:** Database access and migrations using Prisma.
- **Testing:** Comprehensive unit and end-to-end (E2E) tests with Jest.
- **Modular Architecture:** Organized codebase with clear separation of concerns and scalable module structure.

## Technologies Used

- [NestJS](https://nestjs.com/) (Node.js framework)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma ORM](https://www.prisma.io/)
- [Jest](https://jestjs.io/) (testing)
- [JWT](https://jwt.io/) (authentication)
- [Stripe](https://stripe.com/) (payment processing)
- [GraphQL](https://graphql.org/) (API and subscriptions)

## Getting Started

```bash
npm install
npm run start:dev
```


## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## License

This project is [MIT licensed](LICENSE).