function getAllRoutines() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/routines/all",
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function createContest(data) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/contests/",
            method: "POST",
            data: {name: data.name, routineID: data.routine, type: data.type, start: data.start, end: data.end},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function inviteUsersToContest(id, invited) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/invitations/contest",
            method: "POST",
            data: {id, invited: invited.join(",")},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function generateFriendBoxes(friends) {
    let temp = ``;
    for(let i = 0; i < friends.length; ++i) {
        temp += `<div class="friend-invitable" data-id=${friends[i].id}>${friends[i].name}</div>`;
    }
    return temp;
}

function generateRoutineOptions(routines) {
    let temp = ``;
    for(let i = 0; i < routines.length; ++i) {
        temp += `<option value=${routines[i].id}>${routines[i].name}</option>`;
    }
    return temp;
}

$(function() {
    const modal = $("#create-contest-modal");
    const modalBody = $("#modal-body");
    const modalFoot = $(".modal-footer");
    const nameEntry = modalBody.find("#contest-name-entry");
    const friendBox = modalBody.find("#contest-invite-box");
    const contestBox = $("#contests-box");
    const dropdown = modalBody.find("#routine-dropdown");
    const progressBtn = modalBody.find("#progressovertime");
    const noProgressBtn = modalBody.find("#onetime");
    const dates = modalBody.find("#dates");
    const workoutChoice = modalBody.find("#workout-choice");
    const startDate = dates.find("#start-date");
    const endDate = dates.find("#end-date");
    const alert = $("#alert");
    const createBtn = $("#create-btn");

    $("#create-contest-btn").click(function() {
        const promises = [getAllFriends(), getAllRoutines()];
        Promise.all(promises).then(function(resolves) {
            const friends = resolves[0].filter(function(f) {
                return !f.pending;
            });
            if(friends.length === 0) {
                modalBody.children("*").addClass("hidden");
                modalBody.append(`<h4>Uh oh! You need to add some friends before you can make a contest.</h4>`)
                modalFoot.addClass("hidden");
            }
            else if(resolves[1].length === 0) {
                modalBody.children("*").addClass("hidden");
                modalBody.append(`<h4>Uh oh! You need to create a routine before you can make a contest.</h4>`)
                modalFoot.addClass("hidden");
            }
            else {
                modalBody.children("*").removeClass("hidden");
                friendBox.children("*").remove();
                friendBox.append(generateFriendBoxes(friends));
                dropdown.children("*").remove();
                dropdown.append(generateRoutineOptions(resolves[1]));
            }
        });
    });

    modalBody.on("click", ".friend-invitable", function() {
        $(this).toggleClass("active-invite");
    });

    progressBtn.change(function() {
        dates.css("display", "block");
        //workoutChoice.css("display", "none");
    });

    noProgressBtn.change(function() {
        dates.css("display", "none");
        //workoutChoice.css("display", "block");
    });

    createBtn.click(function() {
        let data = {};
        if(nameEntry.val().trim() === "") {
            alert.text("Please enter a name");
            showAlert(alert);
            return;
        }
        data.name = nameEntry.val().trim();
        const friendsToAdd = friendBox.find(".active-invite");
        if(friendsToAdd.length === 0) {
            alert.text("Please add at least 1 friend to your contest");
            showAlert(alert);
            return;
        }
        data.invited = [];
        for(let i = 0; i < friendsToAdd.length; ++i) {
            data.invited.push($(friendsToAdd[i]).attr("data-id"));
        }
        const contestType = modalBody.find("input[name='type']:checked").val();
        if(contestType === undefined) {
            alert.text("Please select a contest type");
            showAlert(alert);
            return;
        }
        data.type = contestType;
        if(contestType === "progress") {
            const start = startDate.val();
            const end = endDate.val();
            if(start.trim() === "" || end.trim() === "") {
                alert.text("Please specify the start and end date");
                showAlert(alert);
                return;
            }
            else if(end < start) {
                alert.text("End date cannot come before start date");
                showAlert(alert);
                return;
            }
            data.start = start;
            data.end = end;
        }
        data.routine = dropdown.val();
        let created;
        createContest(data).then(function(response) {
            created = response;
            return inviteUsersToContest(response.id, data.invited);
        }).then(function() {
            const contest = $(`<div class="contest" data-id=${created.id}>
                                    <img src="https://www.shareicon.net/download/2015/12/30/695232_first.svg" class="standings-btn">
                                <p class="contest-name">${created.name}</p>
                                    <button class="btn log-workout-btn" data-id=${created.routineID}>Log Workout</button>
                                </div>`);
            contestBox.prepend(contest);
            contestBox.find("h4").remove();
            modal.modal("hide");
        });
    });

    contestBox.on("click", ".log-workout-btn", function() {
        window.location.pathname = "contests/" + $(this).parent().attr("data-id").toString() + "/workout";
    });

    contestBox.on("click", ".standings-btn", function() {
        window.location.pathname = "contests/" + $(this).parent().attr("data-id").toString() + "/standings";
    });
});