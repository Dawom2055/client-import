# 05: Confirm and create, ending in Success

**What to build:** After validation passes, the admin confirms the import, watches Clients being created, and sees a Success screen. They can then return to ADX or start another import.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Step 4 states how many Clients will be created and for which Advisor, with Cancel and a create action
- [ ] Step 5 shows progress; the close control is disabled with a hint during creation and works on steps 1 to 4 and on the result screens
- [ ] Success shows the number of Clients created
- [ ] "Done" closes the modal and returns to the ADX Clients page
- [ ] "Back to file upload" resets the modal to the very beginning
- [ ] Escape closes the modal whenever closing is allowed
- [ ] Tests cover each of the above through the modal, using a fake that returns success
