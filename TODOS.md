- make all supabase functionality captured in some util dir
- persist camera coordinates on the board with sendbeacon
- resizable chat window -> overlays 
- add context through interactive controls --> i.e. click on a note to reference it while prompting
- save as PDF, PNG, put it into a google doc
- generating summary of notes in board
- hyperlinks straight onto the board
- RLS 
- backspace to delete a note / arrow / section
- name annotation on cards
- dont resize but just make it longer when the text overflows
- use sendbeacon to save the camera when you exit the board. A concern is with collaboration

- z index for arrows
- a toscreen function to convert coordinates between camera and screen 

- IMPORTANT: canvas needs to like keep all its elements within it, not them being absolutely positioned on the window.
- IMPORTANT: add last modified to all objects 
- order boards in your boards page by time_modified
- thumbnail?

- FIX: if you zoom in / out while drawing section it screws up the selection
- remove all next boilerplate stuff


- IMPORTANT: if you key press on jotchat it triggers the useEffect from canvas
- tool calling is pretty bad + slow

- first priority: zoom in thing
- override the pinch zoom thing 
- second: rename + resize sections
