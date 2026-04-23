import { User } from './interface';

export const admin: User = {
  id: 1,
  name: 'admin',
  email: 'admin@dymer.it',
  avatar: 'images/dymer_logo_d.png',
};

export const guest: User = {
  name: 'editor',
  email: 'editor@dymer.it',
  avatar: 'images/avatar-default.jpg',
};
