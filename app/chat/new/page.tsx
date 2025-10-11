'use client';

import StreamingChatPage from '../[chatId]/StreamingChatPage';

// This page simply renders the StreamingChatPage component
// The StreamingChatPage handles both new chats (chatId='new') and existing chats
// This provides a seamless experience without page reloads when creating a new chat
const NewChatPage = () => {
  return <StreamingChatPage />;
};

export default NewChatPage;
