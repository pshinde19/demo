$(document).ready(function() {
  $(".showcurrency-parent").hide()
  //22 nov 2024
  // var testPopUp = window.open("", "_blank", "width=100,height=100");
  // if (testPopUp === null || typeof testPopUp === "undefined") {
  //   // alert('pop is blocked')
  //   Swal.fire({
  //     icon: "info",
  //     html: `pop up modals are blocked..! please allow pop modals.`,
  //     showCloseButton: false,
  //     showCancelButton: false,
  //     focusConfirm: false,
  //     allowOutsideClick:false
  //   });
  // } else {
  // testPopUp.close();
  if (hasCoarsePointer()) {
      Swal.fire({
        icon: "info",
        html: `Oops! Can't allow mobile devices.`,
        showCloseButton: false,
        showCancelButton: false,
        focusConfirm: false,
        allowOutsideClick:false
      });
    } else {
        getwelcomemsg()
    }
  // }
});

function onload(res){
  if(res){
   // displayrules()
    getwelcomemsg()
    $(".action-btns").css("display","flex")
    // setCookie('user_logged_in', 'true', 7);
    $("body").css("display","block")

   }
   else{
     $(".action-btns").css("display","none")
     $("body").css("display","none")
   }
}


function displayrules(){
  Swal.fire({
    html:`<div class="instructionmodaldiv">
            <h2>Use of Al Data Assistant - Important Instructions</h6> <br>
            <p>Welcome, we are pleased to encourage the use of our Al Data Assistant for professional
              and work-related purposes. It is intended for internal Genpact use only.</p> <br>
            <ul>
              <li>This Al tool is designed to provide a secure environment for you to experiment
                and integrate Al into your ways of working. However, Al is not perfect and
                makes mistakes. You should always verify the results and check the accuracy
                of any Al-generated information because it may contain mistakes.</li>
              <li>The Al Data Assistant must be used in strict accordance with the Genpact s
                policies, including the Code of Conduct. Additionally, your use of Al Data Assist is
                subject to your compliance with the Terms of Use.</li>
              <li>
                We also remind you to avoid disclosing (including entering as input) any client
                data or client-related information unless the processing of that information
                using Al technology is not prohibited or restricted by our contracts with the client. 
                Ensure that you do not misuse personal or sensitive information for any unauthorized purpose.        
              </li>
            </ul>
          </div>`,
    input: "checkbox",
    inputValue: 1,
    inputPlaceholder: `I agree with the terms and conditions.`,
    confirmButtonText: `Accept`,
    confirmButtonColor:"#284449c9",
    allowOutsideClick:false,
    allowEscapeKey:false,
    inputValidator: (result) => {
      //console.log('result',result);
      return !result  && "You need to agree with terms and conditions.";
    }
  });
  document.getElementById('swal2-checkbox').checked = false;
  document.querySelector('.swal2-checkbox input').addEventListener('change', (event) => {
    const button = document.querySelector('.swal2-actions button.swal2-confirm');
    //console.log(button.style.backgroundColor);
      if (button) {
        if (button.style.backgroundColor === 'rgba(40, 68, 73, 0.79)') {
          button.style.backgroundColor = '#00aecf';
        } else {
          button.style.backgroundColor = 'rgba(40, 68, 73, 0.79)';
        }
      }
  });
}

function getwelcomemsg(){
  $.ajax({
    url: "/get_tables", 
    method: "GET",
    // contentType: 'application/json',  
    // data: JSON.stringify(user_data),  
     dataType: "json", 
    success: function(data) {
      // console.log(data); 
     if(data.msg == 'success'){
        $(".action-btns").css("display","flex")
        // setCookie('user_logged_in', 'true', 7);
        $("body").css("display","block")
        $(".response").append(data.myhtmlstr);
        $("#bot-response-0").css({"border": "1px solid #ECECEC","padding": "11px 16px","border-radius": "10px"})
        if(data.my_list.length>0){
            for(let i=0;i<data.my_list.length;i++){
                if(i==0){
                  $(".current-selected-table").text(data.my_list[i])
                  table_selected=data.my_list[i]
                  if(table_selected && currencyFor_Dataproducts.includes(data.my_list[i])){
                      $(".configuration").show()
                  }else{
                      $(".configuration").hide()
                  }
                  if(graphFor_Dataproducts.includes(data.my_list[i])){
                      $("#sliderparentdiv").show()
                  }else{
                      $("#sliderparentdiv").hide()
                  }
                }
                sessionStorage.setItem(data.my_list[i]+"__CWD", JSON.stringify([]));
                $(".selecttbl").append(`<li onclick="selecttblfunc('${data.my_list[i]}')"><span class=""> ${data.my_list[i]}</span> </li>`)  
              } 
              $("#textareainp").prop('disabled',false).css('cursor', 'auto');

        }else{
            $("#textareainp").prop('disabled',true).css('cursor', 'not-allowed');
            $("#dc1").css({
              "pointer-events": "none",
              "opacity": "0.6",
              "cursor": "not-allowed"
            });
            $("#sg1").css({
                "pointer-events": "none",
                "opacity": "0.6",
                "cursor": "not-allowed"
            });

        }
        history_object=data.history
        m_faq=data.faq
        m_previous_question=data.previous_questions
        // console.log(m_faq);
        if (history_object.hasOwnProperty(table_selected)) {
            const value = history_object[table_selected];
            $(".history-ul").html('')
            appendlist(value,table_selected)
        }

        appendfaq(m_faq[table_selected])

        $(".prev_questionslist").html('')
        appendprevious(m_previous_question[table_selected],table_selected)
     }else{
      Toast.fire({
        icon: "error",
        title: "Internal server error while getting tables...!"
      });
      $(".action-btns").css("display","none")
      $("body").css("display","none")
     }
     $("#p-loader").hide()
    },
    error: function(xhr, status, error) {
      $("#p-loader").hide()
     console.log(error)
     Toast.fire({
      icon: "error",
      title: "Internal server error while getting tables...!"
    });
    $(".action-btns").css("display","none")
    $("body").css("display","none")
    }
  });
}

function hasCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches;
}


function appendlist(list,dataproduct){
// console.log('called',history_object[dataproduct].length);
  if(history_object[dataproduct].length == 0){ 
    let hstr1=` <li class="history-li" id="">
                        no favourites available
              </li>`
     $(".history-ul").html('')
     $(".history-ul").append(hstr1)
     return true
  }
    for(let i=0;i<list.length;i++){
      var title=list[i][1].replace(/"/g, "'")  //title="${title}"
      var mystr=`<li class="history-li">
                    <div onclick="answer_favourite(this,'${list[i][0]}')"  class="li-question" style="width:100%">
                       ${title}
                    </div>
                    <div onclick="deletehistory(this,'${list[i][0]}')" data-product="${dataproduct}">
                        <svg class="loadersvg" style="display:none;transform: scaleY(-1);" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" width="16px" height="16px" viewBox="0 0 128 128" xml:space="preserve">
                             <g><circle cx="16" cy="64" r="16" fill="#00AECF"/><circle cx="16" cy="64" r="16" fill="#56c8df" transform="rotate(45,64,64)"/><circle cx="16" cy="64" r="16" fill="#95ddeb" transform="rotate(90,64,64)"/><circle cx="16" cy="64" r="16" fill="#cceff5" transform="rotate(135,64,64)"/><circle cx="16" cy="64" r="16" fill="#e1f5f9" transform="rotate(180,64,64)"/><circle cx="16" cy="64" r="16" fill="#e1f5f9" transform="rotate(225,64,64)"/><circle cx="16" cy="64" r="16" fill="#e1f5f9" transform="rotate(270,64,64)"/><circle cx="16" cy="64" r="16" fill="#e1f5f9" transform="rotate(315,64,64)"/><animateTransform attributeName="transform" type="rotate" values="0 64 64;315 64 64;270 64 64;225 64 64;180 64 64;135 64 64;90 64 64;45 64 64" calcMode="discrete" dur="1200ms" repeatCount="indefinite"/></g>
                        </svg>
                        <svg class="deletesvg" style="display:block;" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="#202020">
                          <title>Delete</title>
                          <path id="fluent--delete-12-regular" d="M6.2,3.6H8.8a1.3,1.3,0,0,0-2.6,0m-1.3,0a2.6,2.6,0,0,1,5.2,0h3.25a.65.65,0,1,1,0,1.3h-.573L12.2,11.621A2.6,2.6,0,0,1,9.61,14H5.39A2.6,2.6,0,0,1,2.8,11.621L2.223,4.9H1.65a.65.65,0,0,1,0-1.3ZM9.45,7.5a.65.65,0,1,0-1.3,0v2.6a.65.65,0,1,0,1.3,0ZM6.2,6.85a.65.65,0,0,1,.65.65v2.6a.65.65,0,0,1-1.3,0V7.5a.65.65,0,0,1,.65-.65M4.094,11.51A1.3,1.3,0,0,0,5.39,12.7H9.61A1.3,1.3,0,0,0,10.9,11.51l.567-6.61H3.529Z" transform="translate(-1 -1)" />
                        </svg>
                    </div>
                </li>
                <li class="border-li"></li>`
      $(".history-ul").append(mystr)
    }
}

var id_counter_=0
function appendfaq(list){
  $(".faqullist").html('')
  for(let i=0;i<list.length;i++){
    var e_id="faq_"+id_counter_
    var htmlstr=`<li  class="faqli" id="${e_id}">
                   ${list[i][1]}
                </li>
                <li class="border-li"></li>`
    $(".faqullist").append(htmlstr)
    var ele=document.getElementById(e_id)
    ele.addEventListener('click',()=>{
      answer_leftbar_questions(list[i][1])
    })
    id_counter_++
  }
}


function appendprevious(list,dataproduct){
  
  if(m_previous_question[dataproduct].length == 0){ 
    let hstr1=` <li class="prevqli" id="">
                        no previous questions available
              </li>`
     $(".prev_questionslist").html('').append(hstr1)
     return true
  }
  for(let i=0;i<list.length;i++){
    var e_id="prev_"+id_counter_
    var htmlstr=`<li  class="prevqli" id="${e_id}">
                   ${list[i][1]}
                </li>
                <li class="border-li"></li>`
    $(".prev_questionslist").append(htmlstr)
    var ele=document.getElementById(e_id)
    ele.addEventListener('click',()=>{
      answer_leftbar_questions(list[i][1])
    })
    id_counter_++
  }
}


function addprevious(list,dataproduct){
  console.log(m_previous_question[table_selected].length);
  if(m_previous_question[dataproduct].length == 0){
    // console.log('*****************************************');
     $(".prev_questionslist").html('')
  }
 // console.log(m_previous_question[table_selected]);
  m_previous_question[table_selected].unshift(list[0])
 // console.log(m_previous_question[table_selected]);
  for(let i=0;i<list.length;i++){
    var e_id="prev_"+id_counter_
    var htmlstr=`<li  class="prevqli" id="${e_id}">
                   ${list[i][1]}
                </li>
                <li class="border-li"></li>`
    $(".prev_questionslist").prepend(htmlstr)
    var ele=document.getElementById(e_id)
    ele.addEventListener('click',()=>{
      answer_leftbar_questions(list[i][1])
    })
    id_counter_++
  }
  //console.log(m_previous_question[table_selected]);
  if (m_previous_question[table_selected].length > 4){
      m_previous_question[table_selected].pop(); 
     // console.log(m_previous_question[table_selected]);
      let ul = document.querySelector('.prev_questionslist');
      let liElements = ul.querySelectorAll('li');
    //  console.log(liElements);
      if (liElements.length > 4) {
          ul.removeChild(liElements[liElements.length - 1]); // Remove last li
          ul.removeChild(liElements[liElements.length - 2]); // Remove second last li
      }
  }
}






// function checkUserCookieAndRedirect() {
//   if (!getCookie('user_logged_in')) {
//      $(".action-btns").css("display","none")
//      $("#textareainp").prop('disabled',true).css('cursor', 'not-allowed');
//   }else{
//     // $(".action-btns").css("display","flex")
//     // $("#textareainp").prop('disabled',false).css('cursor', 'auto');
//   }
// }
// setInterval(checkUserCookieAndRedirect, 1000);


function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}


function deleteCookie(name) {
  document.cookie = name + "=; Max-Age=-99999999;";
}

function truncateString(str) {
  if (str.length > 33) {
      return str.substring(0, 30) + '...';
  }
  return str;
}
