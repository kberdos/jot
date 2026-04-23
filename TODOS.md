- should not be able to edit without signing in, since signing in redirects you and kills the current state. we could potentially store the state in localstorage and pull it back out when we redirect, but that seems a bit clunky.
- home page
- "sign in to view your board" should actually direct you to sign in or something
- order boards in your boards page by time_created
- make all supabase functionality captured in some util dir
- persist camera coordinates on the board
- modal to add name when you make a board
- idea / question note type 
- tree/graph view seems hard (more vertical). prob make more abstract representation
- resizable chat window -> overlays 
- add context through interactive controls --> i.e. click on a note to reference it while prompting
- save as PDF, PNG, put it into a google doc
- generating summary of notes in board
- hyperlinks straight onto the board
- RLS 
- backspace to delete a note
- name annotation on cards
- dont resize but just make it longer when the text overflows
- use sendbeacon to save the camera when you exit the board. A concern is with collaboration

- z index for arrows
- a toscreen function to convert coordinates between camera and screen 

- IMPORTANT: canvas needs to like keep all its elements within it, not them being absolutely positioned on the window.

