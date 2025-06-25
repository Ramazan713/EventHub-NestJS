import { ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GraphqlConfigService {
  private readonly logger = new Logger(GraphqlConfigService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createGqlOptions(): ApolloDriverConfig {
    const isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    
    return {
      typePaths: ['./**/*.graphql'],
      graphiql: isDevelopment, 
      introspection: isDevelopment,
      context: this.createContext.bind(this),
      subscriptions: {
        'graphql-ws': {
          onConnect: this.handleWebSocketConnection.bind(this),
        }
      }
    };
  }

  private async createContext({ req, connectionParams, extra }) {
    if (req) {
      return { req };
    }
    
    if (connectionParams) {
        const token = connectionParams.authorization || connectionParams.Authorization;
      
        if (token) {
            try {
                const cleanToken = (token as string).replace(/^Bearer\s+/i, '');
                const user = await this.verifyToken(cleanToken);
                this.logger.debug(`WebSocket context - authenticated user: ${user.sub}`);
                return { 
                    req: { user }, 
                    user,
                    isAuthenticated: true 
                };
            } catch (error) {
                this.logger.debug('WebSocket context - invalid token, proceeding as anonymous');
                return { 
                    req: { user: null }, 
                    isAuthenticated: false 
                };
            }
        
        }

        this.logger.debug('WebSocket context - no token provided, proceeding as anonymous');
        return { 
            req: { user: null }, 
            isAuthenticated: false 
        };
    }
    return {};
}

  private async handleWebSocketConnection(context) {
    const { connectionParams } = context;
    
    this.logger.debug('WebSocket connection attempt', { connectionParams });
    
    const tokenWithBearer = connectionParams?.Authorization || 
                          connectionParams?.authorization;

    if (tokenWithBearer) {
      const token = (tokenWithBearer as string).replace(/^Bearer\s+/i, '');
      
      try {
        const user = await this.verifyToken(token);
        this.logger.log(`WebSocket connection accepted for authenticated user: ${user.sub}`);
        return { 
          req: { user }, 
          user,
          isAuthenticated: true 
        };
      } catch (err) {
        this.logger.debug(`WebSocket token invalid, accepting as anonymous: ${err.message}`);
        // Token geçersiz ama bağlantıyı reddetme, anonymous olarak kabul et
        return { 
          req: { user: null }, 
          isAuthenticated: false 
        };
      }
    }

    // Token yok, anonymous user olarak kabul et
    this.logger.log('WebSocket connection accepted for anonymous user');
    return { 
      req: { user: null }, 
      isAuthenticated: false 
    };
  }

  private async verifyToken(token: string) {
    return await this.jwtService.verify(token, {
      secret: this.configService.getOrThrow("JWT_SECRET")
    });
  }
}