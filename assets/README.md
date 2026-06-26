<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Our Family Adventures</title>
  <meta name="theme-color" content="#092231" />
  <link rel="manifest" href="manifest.json" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="Our Family Adventures" />
  <link rel="stylesheet" href="style.css" />
</head>
<body class="show-splash">
  <div id="app">
    <section id="splash" class="splash screen active">
      <div class="photo-layer"></div><div class="veil splash-veil"></div><div class="beam"></div><div class="waves"><span></span><span></span><span></span></div>
      <button class="icon-btn splash-menu menu-open" aria-label="Open menu">☰</button>
      <button class="icon-btn splash-bell notify-open" aria-label="Notifications" data-go="notifications">🔔</button>
      <div class="splash-content minimal">
        <button class="gold-btn big" data-go="home">Begin Our Journey ⚓</button>
      </div>
    </section>

    <main id="home" class="screen home">
      <header class="hero">
        <div class="photo-layer home-photo"></div><div class="veil home-veil"></div><div class="waves short"><span></span><span></span></div>
        <button class="icon-btn menu-open" aria-label="Open menu">☰</button>
        <button class="icon-btn heart-btn notify-open" aria-label="Notifications" data-go="notifications">🔔</button>
        <div class="hero-copy compact">
          <p class="kicker">Welcome Home</p>
          <h2>Nags Head 2027</h2>
          <div class="countdown"><strong id="countDays">—</strong> days until adventure</div>
        </div>
      </header>
      <section class="content">
        <div class="daily-card welcome-card">
          <h3>Good evening, Melissa.</h3>
          <p>Continue planning, check family updates, and keep every adventure in one warm place.</p>
        </div>
        <div class="scroll-row" aria-label="Our Family Adventures sections">
          <button class="feature-card" data-go="adventures"><b>Begin a New Chapter</b><span>Create adventures, invite family, RSVP, vote on dates, and suggest locations.</span></button>
          <button class="feature-card" data-go="travel"><b>Travel Plans</b><span>Airbnb links, flights, cars, weather, restaurants, packing, and budget.</span></button>
          <button class="feature-card" data-go="explore"><b>Explore Map</b><span>Add places, open Google Maps, edit pins, and save family favorites.</span></button>
          <button class="feature-card" data-go="people"><b>Family Profiles</b><span>Profile photos, birthdays, home airports, and favorite activities.</span></button>
          <button class="feature-card" data-go="memories"><b>Memories</b><span>Photos, videos, tags, comments, and favorites.</span></button>
          <button class="feature-card" data-go="scrapbook"><b>Scrapbook Pages</b><span>Create keepsake pages with photos, captions, locations, tags, and journal notes.</span></button>
          <button class="feature-card" data-go="chat"><b>Family Chat</b><span>Talk together, use @names, and keep trip decisions in one place.</span></button>
          <button class="feature-card" data-go="journal"><b>Adventure Journal</b><span>Daily notes, favorite moments, and the story behind the photos.</span></button>
          <button class="feature-card" data-go="timeline"><b>Family Timeline</b><span>Watch adventures become a living family history.</span></button>
        </div>
      </section>
    </main>

    <section id="adventures" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Adventures</h2></div>
      <div class="panel hero-panel"><p class="kicker">New Adventure Wizard</p><h3>Where should our next chapter begin?</h3>
        <div class="wizard-grid">
          <label>Adventure name<input id="tripTitle" placeholder="Nags Head 2027"></label>
          <label>Destination<input id="tripLocation" placeholder="Nags Head, NC"></label>
          <label>Arrival date<input id="tripStart" type="date"></label>
          <label>Departure date<input id="tripEnd" type="date"></label>
          <label>Cover photo<input id="tripCover" type="file" accept="image/*"></label>
          <label>Trip privacy<select id="tripVisibility"><option>Everyone</option><option>Invite only</option><option>Private planning</option></select></label>
        </div>
        <div class="panel-sub"><h4>Invite family</h4><div id="inviteChecks" class="chips"></div></div>
        <textarea id="tripNotes" placeholder="Notes, hopes, house details, travel ideas, or anything the family should know"></textarea>
        <button class="gold-btn" id="addTrip">Create Adventure</button>
      </div>
      <div class="panel"><h3>Family Proposals</h3><p>Let people suggest different dates or destinations before the adventure is finalized.</p><div class="grid2"><input id="proposalDate" placeholder="Suggest new dates"><input id="proposalPlace" placeholder="Suggest new location"></div><button id="addProposal" class="navy-btn">Add Suggestion</button><div id="proposalList" class="list"></div></div>
      <div id="tripList" class="list"></div>
    </section>

    <section id="people" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>People</h2></div>
      <div class="panel"><h3>Add a Person</h3><div class="grid2">
        <label>Name<input id="personName" placeholder="Melissa Lehr"></label>
        <label>Profile photo<input id="personPhoto" type="file" accept="image/*"></label>
        <label>Birthday / reminder date<input id="personBirthday" type="date"></label>
        <label>Home airport<input id="personAirport" placeholder="BWI, PHL, MDT"></label>
        <label>Email<input id="personEmail" placeholder="name@email.com"></label>
        <label>Phone optional<input id="personPhone" placeholder="Optional"></label>
      </div><label>Favorite activities or destinations<input id="personFav" placeholder="Beach walks, fishing, coffee, Disney..."></label><p class="small">Profile photos can be selected from your phone Photos/Gallery. This preview compresses photos so they save better on your device.</p><button id="addPerson" class="gold-btn">Add Person</button></div><div id="peopleList" class="cards"></div>
    </section>

    <section id="travel" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Travel Plans</h2></div>
      <div class="tabs"><button data-tab="stays" class="tab active">Stays</button><button data-tab="flights" class="tab">Flights</button><button data-tab="packing" class="tab">Packing</button><button data-tab="food" class="tab">Food</button><button data-tab="weather" class="tab">Weather</button></div>
      <div class="tab-pane active" id="tab-stays"><div class="panel"><h3>Airbnb / VRBO / Hotel Voting</h3><input id="stayTitle" placeholder="Place name"><input id="stayUrl" placeholder="Paste Airbnb, VRBO, hotel, or booking link"><button id="addStay" class="gold-btn">Add Stay Option</button><div id="stayList" class="list"></div></div></div>
      <div class="tab-pane" id="tab-flights"><div class="panel"><h3>Flights & Transportation</h3><div class="grid2"><input id="flightInfo" placeholder="Flight, airline, confirmation"><input id="carInfo" placeholder="Rental car / driving notes"></div><button id="saveTravel" class="navy-btn">Save Travel Notes</button><div id="travelNotes" class="note"></div></div></div>
      <div class="tab-pane" id="tab-packing"><div class="panel"><h3>Packing List</h3><input id="packItem" placeholder="Add item"><button id="addPack" class="gold-btn">Add Item</button><div id="packList" class="list"></div></div></div>
      <div class="tab-pane" id="tab-food"><div class="panel"><h3>Restaurants & Things To Do</h3><input id="foodIdea" placeholder="Restaurant or activity"><button id="addFood" class="gold-btn">Add Idea</button><div id="foodList" class="list"></div></div></div>
      <div class="tab-pane" id="tab-weather"><div class="panel"><h3>Weather</h3><p>Open The Weather Channel for forecasts, alerts, sunrise/sunset, and beach weather for your adventure.</p><button class="navy-btn" onclick="window.open('https://weather.com/search/enhancedlocalsearch?where=Nags%20Head%2C%20NC','_blank')">Open The Weather Channel</button></div></div>
    </section>

    <section id="explore" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Explore Map</h2></div>
      <div class="map-card"><div class="map-bg"><span class="pin p1">🏠</span><span class="pin p2">🍽️</span><span class="pin p3">📸</span><span class="pin p4">⭐</span></div><p class="small">This preview uses saved addresses and opens them in Google Maps. In the Firebase/map version, pins can become live map markers.</p></div>
      <div class="panel"><h3>Add a Pin</h3><input id="pinTitle" placeholder="Pin name"><input id="pinAddress" placeholder="Address or place"><select id="pinType"><option>🏠 Lodging</option><option>🍽️ Restaurant</option><option>📸 Photo Spot</option><option>🏖 Beach</option><option>⛽ Gas</option><option>⭐ Favorite</option></select><button id="addPin" class="gold-btn">Add Pin</button><p class="small">Move a pin by editing its address. Canceled trip pins can be removed or archived.</p><div id="pinList" class="list"></div></div>
    </section>

    <section id="journal" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Adventure Journal</h2></div>
      <div class="panel"><h3>Today's Note</h3><textarea id="journalText" placeholder="What happened today? What made everyone laugh? What should we remember?"></textarea><button id="saveJournal" class="gold-btn">Save Journal Entry</button></div>
      <div class="panel story"><h3>Chapter Notes</h3><div id="journalList" class="list"></div></div>
    </section>

    <section id="memories" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Memories</h2></div>
      <div class="panel"><h3>Add Photos or Videos</h3><input id="memoryFile" type="file" accept="image/*,video/*" multiple><p class="small">Choose from your phone Photos/Gallery or computer files. Original memories stay here even if you also use them in a scrapbook.</p><input id="memoryTitle" placeholder="Memory title"><input id="memoryTags" placeholder="Tag people: Melissa, Bob"><input id="memoryLocation" placeholder="Location, beach, restaurant, or special place"><textarea id="memoryNote" placeholder="Add the story behind this memory..."></textarea><label class="check"><input id="memoryToScrapbook" type="checkbox" checked> Also add this memory to a scrapbook layout</label><button id="addMemory" class="gold-btn">Add Memory</button></div>
      <div class="panel scrapbook-callout"><h3>Scrapbook Pages</h3><p>Turn favorite photos and stories into editable, printable, shareable family album pages. Memories remain safely saved even if you remove a scrapbook page.</p><button class="gold-btn" data-go="scrapbook">Open Scrapbook Studio</button></div><div id="memoryList" class="cards"></div>
    </section>


    <section id="scrapbook" class="screen page scrapbook-page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Scrapbook Studio</h2></div>
      <div class="panel scrapbook-intro"><h3>Every picture captures a moment. Every page tells the story.</h3><p>Create keepsake pages for each adventure with photos, captions, tags, locations, dates, and the story behind the memory.</p></div>
      <div class="panel"><h3>Create a Scrapbook Page</h3>
        <div class="grid2">
          <label>Page title<input id="scrapTitle" placeholder="First Sunset Together"></label>
          <label>Page date<input id="scrapDate" type="date"></label>
          <label>Location<input id="scrapLocation" placeholder="Nags Head, NC"></label>
          <label>Theme<select id="scrapTheme"><option>Coastal</option><option>Vintage</option><option>Rustic</option><option>Christmas</option><option>Mountains</option><option>Modern</option></select></label>
          <label>Layout<select id="scrapLayout"><option value="classic">Classic story page</option><option value="full">Full photo feature</option><option value="collage">Collage memory page</option><option value="journal">Journal note page</option></select></label>
        </div>
        <label>Photo or video<input id="scrapFile" type="file" accept="image/*,video/*"></label>
        <input id="scrapTags" placeholder="Tag people: Melissa, Bob, Emily">
        <textarea id="scrapNote" placeholder="Write the memory... What happened? What made everyone laugh? What should we remember years from now?"></textarea>
        <button id="addScrapPage" class="gold-btn">Save Scrapbook Page</button>
      </div>
      <div class="panel bookshelf"><h3>Adventure Book Shelf</h3><p class="small">Saved pages collect here. Print, download, share, or edit each page. Later these pages can become a full Adventure Book.</p><div class="item-actions"><button class="navy-btn" onclick="printAllScrapbook()">Print Scrapbook</button><button class="mini-btn" onclick="downloadScrapbookHtml()">Download Scrapbook</button></div><div id="scrapbookList" class="scrapbook-grid"></div></div>
    </section>

    <section id="chat" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Family Chat</h2></div>
      <div class="panel"><div id="chatList" class="chat-list"></div><div class="chat-row"><input id="chatInput" placeholder="Message family... use @Name"><button id="sendChat" class="gold-btn">Send</button></div><p class="small">Push notifications will require Firebase Auth + Messaging in the live production build. @mentions work by family profile name.</p></div>
    </section>


    <section id="notifications" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Notifications</h2></div>
      <div class="panel"><h3>Family Updates</h3><p>Get updates for messages, new adventures, photo uploads, voting, RSVP changes, and travel changes.</p>
        <div class="notify-actions"><button id="enableNotifications" class="gold-btn">Turn On Device Notifications</button><button id="addTestNotification" class="navy-btn">Send Test Update</button></div>
        <p class="small">This build adds an in-app notification center and browser notification preview. True push notifications when the app is closed will be connected in the Firebase Messaging build.</p>
      </div>
      <div class="panel"><h3>Notification Preferences</h3>
        <label class="check"><input type="checkbox" class="pref" value="messages" checked> Messages and @mentions</label>
        <label class="check"><input type="checkbox" class="pref" value="adventures" checked> New adventures and trip changes</label>
        <label class="check"><input type="checkbox" class="pref" value="photos" checked> Photos, videos, and tags</label>
        <label class="check"><input type="checkbox" class="pref" value="voting" checked> Voting, Airbnb choices, date/location proposals</label>
        <label class="check"><input type="checkbox" class="pref" value="travel" checked> Travel plans, weather, packing reminders</label>
      </div>
      <div class="panel"><h3>Recent Updates</h3><div id="notificationList" class="list"></div></div>
    </section>

    <section id="favorites" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Family Favorites</h2></div><div class="panel"><p>Favorite memories and places collect here.</p><div id="favList"></div></div></section>
    <section id="timeline" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Family Timeline</h2></div><div class="panel timeline"><h3>Every adventure becomes part of our story.</h3><div id="timelineList"></div></div></section>
    <section id="story" class="screen page"><div class="page-head"><button class="back" data-go="home">← Home</button><h2>Our Story</h2></div><div class="panel story"><h3>A place where memories are made, adventures are planned, and family stories live on.</h3><p>Every family has a story that began long before this app. These pages help preserve the chapters we're writing today while honoring every adventure that came before.</p><h3>The Circle</h3><p>A circle has no beginning and no end. No one stands at the front. No one stands behind. Every person is equally important. Every voice matters. Every smile is seen. Every memory belongs.</p></div></section>

    <nav class="bottom-nav" aria-label="Main navigation"><button data-go="home">Home</button><button data-go="adventures">Chapters</button><button data-go="people">People</button><button data-go="travel">Travel</button><button data-go="explore">Explore</button><button data-go="memories">Memories</button><button data-go="scrapbook">Scrapbook</button><button data-go="chat">Chat</button></nav>
    <aside id="drawer" class="drawer"><button id="closeDrawer" class="drawer-close">×</button><h3>Our Family Adventures</h3><button data-go="home">Home</button><button data-go="adventures">Chapters</button><button data-go="people">People</button><button data-go="travel">Travel Plans</button><button data-go="explore">Explore Map</button><button data-go="memories">Memories</button><button data-go="scrapbook">Scrapbook Studio</button><button data-go="chat">Chat</button><button data-go="notifications">Notifications</button><button data-go="journal">Adventure Journal</button><button data-go="timeline">Family Timeline</button><button data-go="story">Our Story</button></aside><div id="scrim" class="scrim"></div>
  </div>
  <script type="module" src="firebase-config.js"></script>
  <script src="app.js"></script>
</body>
</html>
