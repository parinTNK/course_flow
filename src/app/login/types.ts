export type LoginResult = {
    success: boolean;
  error?: string;
  data?: {
    user: any;
    profile: any;
    session: any;
    
  };
}
  