export const getAccounts = async ({ userId }: { userId: string }) => {
  // Backend yok, o yüzden sayfaya boş bir hesap listesi gönderiyoruz
  return { data: [] };
}

// Eğer sayfa getAccount (tekil) fonksiyonunu da isterse diye bunu da ekleyelim:
export const getAccount = async ({ appwriteItemId }: { appwriteItemId: string }) => {
return { 
    data: null,
    transactions: [] // TypeScript hatasını önlemek için boş dizi dönüyoruz
  };
}
