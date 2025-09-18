
import admin from 'firebase-admin';
import { initializeApp, getApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import 'server-only';

const projectId = "petertrade-pulse";
const clientEmail = "firebase-adminsdk-fbsvc@petertrade-pulse.iam.gserviceaccount.com";
const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAe/Q+HPMXuNii\n1pMlIVoeJoGOOwq1HYmYrtEhVXnG/RuKNaibxVMaZHvASUjhrRLXzk6V/syvheJG\nT/Lw8iYMAg682LDbQ+a0rVBJkGeGogx+6mv+0obBOJ36slaDVKBDcrsxfdyLBmeQ\nFqT5bfP8H+ws/HJDsQFB9OZLSMaBWxJ5rGUD6iegZxcAJpj2QQUhCLHVMSV6WhQ7\nLm03RRmRfaWQrw1S0IGqzDQuB0n0CI2sIULpFFaTWS4yu92J4lE8OkpH5GjiNIQ8\nGoZoqzgshBKocBJzQrWP3rhg8FGn9rkTykdGLHiFNtIovBPx7VWtsmFcOJZtb+u2\n5Xx0h89VAgMBAAECggEAE7SM4k/55f+PNAp2CWrS7DvCbyJlu/lwZPBeqgQzYZb3\nWwyXvIy0r4LCdYK7IplikLPG8U2ivERfUBXut9J+aSPLyPMBFg1rQKtuiP1uz8Zm\ns5aBpFZ+o6jNaYUY3LyM5KLJ/azWJ2hqMULUNFHYlMLa3ZchhoMILy2oZuQmKEdS\nMqgA9Ou4fP/g6boIRGWtnm7G3DKIMAF9Y16JsDS9tzM3UiRLUAMB6LvjEfrbD4yT\nrz9+a1xr4VX8f+k0BunKkdx6+I3hdKDCD+5pht32kqPRJ5R7pDqGGTen9M1pzCOk\nXLNLyJeB0Cr41LAkttm4mcur0gM6MbCubFZf+OJYMQKBgQDwStsV69XhaBS+u+rh\nEYOMA7rwQnyo8Tq9hcnJp0DlJ8mNzU4G+Q0677sxfV/7hOlHvY9BZeZqYPsFVjdT\n9vcIPEgc2/v6/jzM+cAg4w5V2SxRV/ruwmk4adAxVCNx8yCvsadO1j76xuYib5Fq\nZdgKcfmCoHTZvoX1QXR2mxvt8QKBgQDNEQ68e0AIkfSxjFdX/Ys2DPK+BBcsKuOD\ngmjczodU7w/xl+BfhQxlcmVkG6zY1w36vfsmD+fjGxGnLBDZlUqtLszM2y/ULXex\nvQbJyTUBg650O6XKLXsRdmKURdH+FhlHClU98XKX6+arVEhNzPhrxTocSDTczfCR\nqKBVmHejpQKBgFZQPTQ5m4E1NsZwj+U6ukrwCBVHfKnexN/RD/O8fWYTDaY/Cfkd\nOvBhrpcPVwvs6TLY132BUewCXAjFuGgTvRabOLgNGQ1Gh6aFS8tEZCDYOsAZX0ym\nTs9xytP9SiIjWClkIhoCgWrpST8zXkOew6S03hBa/L4+XrYDRgdYngaxAoGBAKVz\nObyAhG1ltVL6tA3eFs+JKuB8VGXiRKX6NbjROQchym9V5kWrBxFidsOKQK7C9Bh1\n54gSFTl6wYdrWjzy4slPlRVDUxeRh5zzseJkYEvUfpBw/5Zbk4vHREn0+zRRiBt1\nDslnYNmKDxX0blG3KkdpXTUsXNo5nfsnXhUxanWxAoGBAJtg7ifSsitgEe+DFboT\ndrSeL6XOmcjV3iTuKwiNQbv5JGlY81VEYwg45Ze+VYt1ghEpfWDbWmdhbzjKoSbX\nbxGQQzdZgTG2GgAqJYN9JTVPrMs7kVxC8E4ZacG4VaJSirbMl923bQvNyGFW95M7\nttm6FXEYNteO3MGrU74ma/ab\n-----END PRIVATE KEY-----";
const databaseURL = "https://petertrade-pulse-default-rtdb.firebaseio.com";
const storageBucket = "petertrade-pulse.appspot.com";

export const isAdminConfigured = projectId && clientEmail && privateKey && databaseURL && storageBucket;

function initializeAdminApp(): App {
    if (admin.apps.length > 0) {
        return getApp();
    }
    
    const serviceAccount = {
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
    };

    return initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL,
        storageBucket,
    });
}

const adminApp = initializeAdminApp();
const adminAuth = getAuth(adminApp);
const adminDb = getDatabase(adminApp);
const adminStorage = getStorage(adminApp);
const adminBucket = adminStorage.bucket();

const ServerValue = admin.database.ServerValue;

export { adminApp, adminAuth, adminDb, adminStorage, adminBucket, ServerValue };
