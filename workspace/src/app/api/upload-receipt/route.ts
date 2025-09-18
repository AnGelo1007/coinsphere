{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true",
      ".indexOn": ["email", "isAdmin", "referralCode"],
      "$uid": {
        ".read": "auth != null && ($uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        ".write": "auth != null && ($uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)"
      }
    },
    "referralCodes": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "orders": {
      ".indexOn": ["userId"],
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('isAdmin').val() === true || (newData.child('userId').val() === auth.uid))",
      "$orderId": {
        ".read": "data.child('userId').val() === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true",
        ".write": "auth != null && (root.child('users').child(auth.uid).child('isAdmin').val() === true || (data.child('userId').val() === auth.uid && newData.child('userId').val() === auth.uid))"
      }
    },
    "receipts": {
       ".read": "auth.token.admin == true",
       "$uid": {
         ".read": "auth != null && $uid === auth.uid",
         ".write": "auth != null && $uid === auth.uid"
       }
    },
    "withdrawals": {
      ".indexOn": ["userId", "date"],
       ".read": "auth != null",
       ".write": "auth != null",
       "$withdrawalId": {
          ".read": "data.child('userId').val() === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true"
       }
    },
    "tickets": {
      ".write": "auth != null",
      ".indexOn": ["userId", "createdAt"],
       ".read": "auth != null",
      "$ticketId": {
        ".read": "data.child('userId').val() === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true",
        ".write": "auth != null && (data.child('userId').val() === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        "messages": {
          ".write": "auth != null && (data.parent().child('userId').val() === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)"
        },
        "userHasRead": {
           ".write": "auth != null && (data.parent().child('userId').val() === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)"
        }
      }
    },
    "depositInfo": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true"
    },
    "settings": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true"
    },
    "admin-notifications": {
      ".read": "root.child('users').child(auth.uid).child('isAdmin').val() === true",
      ".write": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true",
      ".indexOn": ["timestamp"]
    },
    "notifications": {
      "$uid": {
        ".read": "auth != null && $uid === auth.uid",
        ".write": "auth != null && ($uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        ".indexOn": ["timestamp"]
      }
    },
    "announcements": {
      "$uid": {
        ".read": "auth != null && $uid === auth.uid",
        ".write": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true"
      }
    }
  }
}