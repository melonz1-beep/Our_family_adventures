# QA Test Checklist Before Final Deployment

## Firebase
- App shows connected to Firebase.
- No “paste Firebase configuration” message appears.
- Anonymous sign-in works.
- Firestore read/write works.
- Storage upload works.

## Images
- Lighthouse home photo loads.
- Splash background loads.
- No broken image icons appear.

## Profiles
- Add profile with photo.
- Edit profile photo, phone, and email.
- Delete one profile.
- Select multiple profiles and delete.

## Trips
- Add new trip.
- Edit trip.
- Delete trip.
- Add lodging links and open them.
- Create private trip and verify only invited people can see it.
- Countdown appears.
- Weather appears for trip area.

## Memories/Scrapbook
- Upload full-resolution photo.
- Download photo.
- Create scrapbook page.
- Resize/rearrange collage photos.
- Print/export scrapbook page.

## Voting
- Add multiple trip options.
- Add multiple lodging options.
- Add multiple date options.
- Vote as different users.
- Confirm analytics shows highest/lowest votes.
- Confirm voter names show.

## Lists/Meals
- Add group shopping item.
- Add individual shopping item.
- Add group packing item.
- Add individual packing item.
- Add meal item and have someone volunteer.

## Communication
- Send group chat message.
- Send direct message.
- Select multiple people for email/text.
- Select all people for email/text.

## Notifications
- Opt into notifications.
- Trigger test notification.
- Confirm unsupported browsers show a clear message.

## PWA
- Android install button works.
- iOS instructions appear.
- Installed app matches Chrome version.
- Service worker cache updates after deployment.
- Side menu scrolls on mobile.
