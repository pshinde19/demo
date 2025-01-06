function getTimestamp() {   //new try
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Add leading 0 if necessary
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');   
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;    
}

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });

function formatted_datetime(){
    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = dayNames[now.getDay()];
    const monthName = monthNames[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    // const formattedDate = `${dayName} ${monthName} ${day} ${year} at ${hours}:${minutes}:${seconds} ${ampm}`;
    const formattedDate = `${hours}:${minutes} ${ampm}`;
    return formattedDate;
}

var sendbtn=document.getElementById('sendbtn')
var chatbox=document.getElementById('chatbox-main-ul')
var textareainp=document.getElementById('textareainp')
var div_counter=0
var table_selected=''
var currency_selected='Millions'
var processing=true;
var currencyFor_Dataproducts=["Data Product - FinDex"]
var graphFor_Dataproducts=['Data Product - C&B', 'Data Product - AI Index', 'Data Product - FinDex']
var is_graph=false   
var experience=false;
var exclude_experience=false;
var history_object={}
var m_faq={}
var m_previous_question={}
function getanswer(userinput1,qid='None'){
    var timestampquery=getTimestamp()
    var userinput = DOMPurify.sanitize(userinput1, {
                        SAFE_FOR_JQUERY: true,
                        // SAFE_FOR_TEMPLATES: true,
                        // RETURN_DOM: true,
                        // FORBID_TAGS: ['script', 'iframe'],
                        FORBID_ATTR: ['onerror', 'onclick','href','src'],
                        ALLOWED_TAGS:[],
                        ALLOWED_ATTR:[]
                    }).toString(); 
   // console.log('userinput',userinput)
    if(userinput != '' && processing){
        addprevious([['None',userinput]],table_selected)
        processing=false;
        $("#sendbtn").hide()
        $("#processbtn").show()
        getque(userinput)
        let updatedArray = JSON.parse(sessionStorage.getItem(table_selected + "__CWD"));
        var formdata = new FormData();
        formdata.append('que', userinput);
        formdata.append('tablename',table_selected)
        formdata.append('currency',currency_selected)
        formdata.append('is_graph',is_graph)
        formdata.append('session_history',JSON.stringify(updatedArray))
        formdata.append('experience',experience)
        formdata.append('exclude_experience',exclude_experience)
        formdata.append('qid',qid)
        if(table_selected != ''){
            var logdata={
                // "username":user_data['preferred_username'].split('@')[0],
                "timestampquery":timestampquery,
                "question":userinput,
               // "response":response.result['response'],
                "dataproduct":table_selected
            }
            appendToSessionStorage(table_selected, userinput)
            $.ajax({
                type: 'POST',
                url: '/getanswer',
                data: formdata,
                processData: false, 
                contentType: false,
                success: function(response) {
                    //console.log(response);
                    document.getElementById('myloader').remove()
                    if(response.msg =='success'){
                        logdata['responsetype']=response.result.responsetype,
                        logdata["timestampresponse"]=getTimestamp()
                        getresponse(response.result,logdata)
                        processing=true;
                        sendlogs(logdata)
                    }else if(response.msg =='error'){
                        var lastresp="#bot-response"+ div_counter
                        if(response.error != ''){
                            $(lastresp).append(`<div class="response" style="display:block;">${response.error}</div>` )
                        }
                        div_counter+=1
                        logdata['responsetype']=response.result.responsetype
                        logdata["timestampresponse"]=getTimestamp()
                        processing=true;
                        sendlogs(logdata)
                    }
                    $("#sendbtn").show()
                    $("#processbtn").hide()
                },
                error: function(error) {
                    // console.log(error);
                    document.getElementById('myloader').remove()
                    var lastresp="#bot-response"+ div_counter
                    $(lastresp).append(`<div class="response" style="display:block;width: 100%;">It appears there are some connectivity issues. Please try again.</div>` )
                    div_counter+=1
                    logdata['responsetype']='Not Answered'
                    logdata["timestampresponse"]=getTimestamp()
                    processing=true;
                    sendlogs(logdata)
                    $("#sendbtn").show()
                    $("#processbtn").hide()
                }
            });
        }else{
            document.getElementById('myloader').remove()
            var lastresp="#bot-response"+ div_counter
            $(lastresp).append(`<div class="response" style="display:block;color:red;width: 100%;">No table selected....</div>` )
            div_counter+=1
            $("#sendbtn").show()
            $("#processbtn").hide()
            processing=true;
        }
    }
}

function getque(userinput){ //<span class="thinkingloader"></span>
    var htmlstr = document.createElement('li');
    htmlstr.className = 'rightli';
    htmlstr.innerHTML = `
        <div class="bot-question Pli">
            <div class="u-question">
                <div></div>
                <div style="font-size: 12px; display: flex; align-items: center;text-align:right;justify-content: right;margin-top: 7px;line-height: 14.40px;"></div>
            </div>
        </div>
    `;

    htmlstr.querySelector('.u-question > div').textContent = userinput;
    htmlstr.querySelector('.u-question > div:nth-child(2)').textContent = formatted_datetime();

    chatbox.appendChild(htmlstr);

    var responseLi = document.createElement('li');
    responseLi.className = 'leftli';
    responseLi.innerHTML = `
        <div class="bot-response Pli">
            <div class="botlogodiv">
                <img src="../static/newlogos/scouticon1080x1080.png" alt="" srcset="">
            </div>
            <div>
                <div id="bot-response${div_counter}" style="border: 1px solid #ECECEC;padding: 11px 16px;border-radius: 10px;">
                    <div id="myloader" style="display: flex;align-items: center;gap: 2px;margin: auto 0px;">
                        <div style="color: #102345; font-size: 13px; font-weight: 400; word-wrap: break-word;display: flex;align-items: center;flex-direction: row;">
                            Scout is thinking
                            <div class="dots1">
                                <div class="dot1"></div>
                                <div class="dot1"></div>
                                <div class="dot1"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

chatbox.appendChild(responseLi);
    textareainp.value=''
    var detailsElements = document.querySelectorAll('details');
    var scrolldiv = document.getElementById("chatbox-main-ul");
    scrolldiv.scrollTop = scrolldiv.scrollHeight;
}

function getresponse(data,logdata){ 
    // var j_logdata=JSON.stringify(logdata)
    // var j_logdataStr = JSON.stringify(j_logdata).replace(/"/g, '&quot;').replace(/'/g, "&apos;");
    var lastresp="#bot-response"+ div_counter
    if(data['response'] != ''){  
        $(lastresp).append(`<div class="response" style="display:block;">${data['response']}</div>` )
    }
    if(data['new_data'] != ''){ 
        $(lastresp).append(`
             <div class="details" >
                <div class="mydataframe-parent"  style="width: fit-content;margin: 0px auto;">
                <div class="table-utility-parent">
                        <div class="table-utility">
                            <div>
                                <button kind="elementToolbar" class="" id="downloadfulldata${div_counter}" onclick="exportTableToExcel(this)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                                    <title>download</title>
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"></path>
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"></path>
                                    </svg>
                                </button>
                            </div>
                            <div>
                                <button kind="elementToolbar" onclick="searchonoff(this)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                                        <title>search</title>
                                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="modalopener">
                                <button  kind="elementToolbar" onclick="openmodal(this)" style="display:block;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fullscreen" viewBox="0 0 16 16">
                                        <title>fullscreen</title>
                                        <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="mysearchutility" style="display: none;">
                            <div>
                                <input type="search" name="" id="" placeholder="Search here..." style="display: block;" oninput="searchtable(this)"> 
                            </div>
                        </div>
                </div>
                <div class="mydataframe">
                ${data['new_data']}
                </div>
                </div>
            </div> 
            `)
            const parser = new DOMParser();
            const doc = parser.parseFromString(data['new_data'], 'text/html');
            const table = doc.querySelector('table');
            const tableId = table.id;
            addSorting(tableId)
            $(lastresp).show()
    }
    if(data['graph_html'] != ''){ //${data['graph_html']} 
    //   console.log(JSON.parse(data['graph_html']));
       var gdata=JSON.parse(data['graph_html'])
        $(lastresp).append(`
         <div class="details" style="max-width:60vw;height:410px;position:relative;padding:0px;overflow:auto;">
             <div class="last-graph-1" id='last-graph${div_counter}' style="width:550px;height:400px;">    
             </div>
         </div>
         `)

         var config = { responsive: true };
         var id=`last-graph${div_counter}`
         Plotly.newPlot(id, gdata.data, gdata.layout, config);
         window.addEventListener('load',()=>{
            let element = document.getElementById(id);
            if (element) {
                Plotly.newPlot(id, gdata.data, gdata.layout, config);
            }
            
         })
         window.addEventListener('resize',()=>{
            let element = document.getElementById(id);
            if (element) {
                Plotly.newPlot(id, gdata.data, gdata.layout, config);
            }
         })
     }


$(lastresp).append(`<div style="font-size: 12px; display: flex; align-items: center;text-align:right;justify-content: right;color: #202020;margin-top: 7px;line-height: 14.40px;" >${formatted_datetime()}</div>`)  //data-clipboard-text="${data['response']}"
$(lastresp).after(`
    <div class="utilitybtns">
        <div class="utility-icons" id="favourite${div_counter}">
            <svg class="loadersvg" style="display:none;transform: scaleY(-1);" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" width="16px" height="16px" viewBox="0 0 128 128" xml:space="preserve">
                           <g><circle cx="16" cy="64" r="16" fill="#02adcf"/><circle cx="16" cy="64" r="16" fill="#56c8df" transform="rotate(45,64,64)"/><circle cx="16" cy="64" r="16" fill="#95ddeb" transform="rotate(90,64,64)"/><circle cx="16" cy="64" r="16" fill="#cceff5" transform="rotate(135,64,64)"/><circle cx="16" cy="64" r="16" fill="#e1f5f9" transform="rotate(180,64,64)"/><circle cx="16" cy="64" r="16" fill="#e1f5f9" transform="rotate(225,64,64)"/><circle cx="16" cy="64" r="16" fill="#e1f5f9" transform="rotate(270,64,64)"/><circle cx="16" cy="64" r="16" fill="#e1f5f9" transform="rotate(315,64,64)"/><animateTransform attributeName="transform" type="rotate" values="0 64 64;315 64 64;270 64 64;225 64 64;180 64 64;135 64 64;90 64 64;45 64 64" calcMode="discrete" dur="1200ms" repeatCount="indefinite"/></g>
            </svg>
           
            <svg class="marksvg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 14 20.004">
                 <title>Mark as favourite</title>
                 <path id="bookmark_selected" data-name="bookmark selected" d="M16,2H8A3,3,0,0,0,5,5V21a1,1,0,0,0,1.5.87L12,18.69l5.5,3.18A1,1,0,0,0,19,21V5a3,3,0,0,0-3-3m1,17.27-4.5-2.6a1,1,0,0,0-1,0L7,19.27V5A1,1,0,0,1,8,4h8a1,1,0,0,1,1,1Z" transform="translate(-5 -2)" fill="#202020"/>
            </svg>

        </div>
        <div class="utility-icons"   id="copytext${div_counter}" >
          <svg width="16" height="16" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <title>Copy to clipboard</title>
            <path id="Vector" d="M3.9 0H9.75C10.1075 0 10.4137 0.1274 10.6685 0.3822C10.9233 0.637 11.0504 0.942933 11.05 1.3V9.1C11.05 9.4575 10.9228 9.76365 10.6685 10.0184C10.4141 10.2732 10.1079 10.4004 9.75 10.4H3.9C3.5425 10.4 3.23657 10.2728 2.9822 10.0184C2.72783 9.76408 2.60043 9.45793 2.6 9.1M3.9 0C3.54293 0.000433333 3.237 0.127833 2.9822 0.3822C2.7274 0.636567 2.6 0.9425 2.6 1.3V9.1M3.9 0V0.5H3.90034M3.9 0L3.90061 0.5C3.90052 0.5 3.90043 0.5 3.90034 0.5M2.6 9.1H3.1V9.09974M2.6 9.1L3.1 9.09939C3.1 9.09951 3.1 9.09962 3.1 9.09974M3.1 9.09974V1.3C3.1 1.07631 3.17386 0.897377 3.33545 0.736054C3.49747 0.574314 3.67688 0.50033 3.90034 0.5M3.1 9.09974C3.10035 9.32437 3.17456 9.5037 3.33575 9.6649C3.49701 9.82615 3.67604 9.9 3.9 9.9H9.75H9.75061C9.9747 9.90027 10.1536 9.82652 10.3146 9.6652C10.4761 9.50339 10.55 9.32399 10.55 9.1V1.3V1.29939C10.5503 1.07651 10.4768 0.897605 10.3149 0.735754L10.6654 0.385243L10.3149 0.735753C10.153 0.573883 9.97371 0.5 9.75 0.5H3.90034M3.4 9.1V9.6H3.9H9.75H10.25V9.1V1.3V0.8H9.75H3.9H3.4V1.3V9.1ZM0.5 11.6997V3.1H0.8V11.7V12.2H1.3H7.95V12.5H1.3C1.07604 12.5 0.89701 12.4262 0.735754 12.2649C0.574542 12.1037 0.500331 11.9243 0.5 11.6997Z" stroke="#202020"/>
          </svg>
         <!--- <img src="../static/newlogos/copy-clipboard.svg" alt="" srcset="">-->
        </div>
        <div class="utility-icons  rbtn1" id="postiveres${div_counter}">
          <svg width="18" height="18" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <title>Positive</title>
            <g id="hugeicons--thumbs-down">
            <mask id="path-1-inside-1_414_2280" fill="white">
            <path d="M0 6.30044C0 5.92915 0.147495 5.57307 0.410037 5.31052C0.672579 5.04798 1.02866 4.90049 1.39995 4.90049C1.95689 4.90049 2.49101 5.12173 2.88482 5.51554C3.27864 5.90936 3.49988 6.44348 3.49988 7.00042V9.80032C3.49988 10.3573 3.27864 10.8914 2.88482 11.2852C2.49101 11.679 1.95689 11.9002 1.39995 11.9002C1.02866 11.9002 0.672579 11.7528 0.410037 11.4902C0.147495 11.2277 0 10.8716 0 10.5003V6.30044ZM9.4348 3.01493L9.24756 3.61691C9.09531 4.11039 9.01831 4.35713 9.07781 4.55225C9.12611 4.71141 9.23058 4.84761 9.3718 4.93549C9.6821 5.05178 10.0163 5.08965 10.3448 5.04573H10.6274C12.4263 5.04573 13.3258 5.04573 13.751 5.57771C13.7995 5.63879 13.8428 5.70376 13.8805 5.77196C14.2078 6.36519 13.8359 7.16578 13.093 8.7661C12.4114 10.2343 12.0693 10.9693 11.4367 11.4006C11.3755 11.4426 11.3125 11.4823 11.2477 11.5196C10.581 11.9011 9.75504 11.9011 8.1031 11.9011H7.74523C5.7433 11.9011 4.74321 11.9011 4.12111 11.2991C3.499 10.6972 3.49988 9.7242 3.49988 7.78789V7.10629C3.44045 6.43588 3.5015 5.76025 3.68012 5.11136C3.98894 4.50489 4.40176 3.95732 4.89983 3.49354L7.76361 0.322646C7.80761 0.271183 7.85435 0.222114 7.9036 0.175651C8.04679 0.0520454 8.23272 -0.0104989 8.4215 0.00144289C8.61028 0.0133847 8.78685 0.0988606 8.91332 0.239523C8.95583 0.291933 8.99555 0.346548 9.03231 0.403143C9.09531 0.492973 9.15627 0.584553 9.21518 0.677883C9.39826 0.977736 9.52013 1.31089 9.57375 1.6581C9.62736 2.00531 9.61166 2.3597 9.52755 2.70081C9.49955 2.80639 9.46863 2.91081 9.4348 3.01405"/>
            </mask>
            <path d="M1.39995 11.9002V13.1002V11.9002ZM0 10.5003H-1.2H0ZM8.28895 2.65851C8.48579 2.02568 9.15838 1.67224 9.79121 1.86908C10.424 2.06592 10.7775 2.73851 10.5806 3.37134L8.28895 2.65851ZM9.24756 3.61691L8.10088 3.26315L8.10171 3.26049L9.24756 3.61691ZM9.07781 4.55225L10.2256 4.20224L10.2261 4.20382L9.07781 4.55225ZM9.3718 4.93549L8.95067 6.05916C8.87642 6.03133 8.80511 5.99622 8.73778 5.95432L9.3718 4.93549ZM10.3448 5.04573L10.1857 3.85632C10.2384 3.84927 10.2916 3.84573 10.3448 3.84573V5.04573ZM13.751 5.57771L14.6884 4.82845L14.6912 4.83206L13.751 5.57771ZM13.8805 5.77196L14.9304 5.19085L14.9313 5.19235L13.8805 5.77196ZM13.093 8.7661L14.1815 9.27135L14.1815 9.2714L13.093 8.7661ZM11.4367 11.4006L10.7581 10.411L10.7607 10.4092L11.4367 11.4006ZM11.2477 11.5196L11.8471 12.5592L11.8437 12.5612L11.2477 11.5196ZM3.49988 7.10629L4.69519 7.00033C4.69832 7.03556 4.69988 7.07092 4.69988 7.10629H3.49988ZM3.68012 5.11136L2.52316 4.79287C2.54466 4.71476 2.57402 4.63903 2.61078 4.56684L3.68012 5.11136ZM4.89983 3.49354L5.79039 4.29784C5.7672 4.32352 5.74291 4.34818 5.71759 4.37175L4.89983 3.49354ZM7.76361 0.322646L8.67563 1.10253C8.66858 1.11077 8.66143 1.11891 8.65417 1.12695L7.76361 0.322646ZM7.9036 0.175651L7.08018 -0.697265C7.09301 -0.709365 7.1061 -0.721181 7.11945 -0.732704L7.9036 0.175651ZM8.91332 0.239523L9.80568 -0.562778C9.81926 -0.547677 9.83245 -0.532234 9.84524 -0.516464L8.91332 0.239523ZM9.03231 0.403143L8.04983 1.09215C8.04167 1.08051 8.03372 1.06873 8.02597 1.0568L9.03231 0.403143ZM9.21518 0.677883L10.2299 0.0373305C10.2331 0.0423774 10.2363 0.0474481 10.2394 0.052542L9.21518 0.677883ZM9.52755 2.70081L10.6926 2.9881C10.691 2.99489 10.6892 3.00166 10.6875 3.00841L9.52755 2.70081ZM10.5751 3.38772C10.3688 4.01751 9.69092 4.36076 9.06113 4.15439C8.43134 3.94802 8.08809 3.27017 8.29446 2.64038L10.5751 3.38772ZM-1.2 6.30044C-1.2 5.61089 -0.926075 4.94958 -0.438491 4.462L1.25856 6.15905C1.22107 6.19655 1.2 6.24741 1.2 6.30044H-1.2ZM-0.438491 4.462C0.0490952 3.97441 0.710402 3.70049 1.39995 3.70049V6.10049C1.34692 6.10049 1.29606 6.12155 1.25856 6.15905L-0.438491 4.462ZM1.39995 3.70049C2.27515 3.70049 3.1145 4.04816 3.73335 4.66701L2.0363 6.36407C1.86753 6.1953 1.63863 6.10049 1.39995 6.10049V3.70049ZM3.73335 4.66701C4.35221 5.28587 4.69988 6.12522 4.69988 7.00042H2.29988C2.29988 6.76174 2.20507 6.53284 2.0363 6.36407L3.73335 4.66701ZM4.69988 7.00042V9.80032H2.29988V7.00042H4.69988ZM4.69988 9.80032C4.69988 10.6755 4.35221 11.5149 3.73335 12.1337L2.0363 10.4367C2.20507 10.2679 2.29988 10.039 2.29988 9.80032H4.69988ZM3.73335 12.1337C3.1145 12.7526 2.27515 13.1002 1.39995 13.1002V10.7002C1.63863 10.7002 1.86753 10.6054 2.0363 10.4367L3.73335 12.1337ZM1.39995 13.1002C0.710401 13.1002 0.0490932 12.8263 -0.438491 12.3387L1.25856 10.6417C1.29606 10.6792 1.34692 10.7002 1.39995 10.7002V13.1002ZM-0.438491 12.3387C-0.926075 11.8512 -1.2 11.1898 -1.2 10.5003H1.2C1.2 10.5533 1.22107 10.6042 1.25856 10.6417L-0.438491 12.3387ZM-1.2 10.5003V6.30044H1.2V10.5003H-1.2ZM10.5806 3.37134L10.3934 3.97332L8.10171 3.26049L8.28895 2.65851L10.5806 3.37134ZM10.3942 3.97067C10.3551 4.09748 10.3252 4.19433 10.301 4.27782C10.2767 4.36164 10.2643 4.41137 10.258 4.44166C10.2431 4.51271 10.2825 4.38869 10.2256 4.20224L7.92999 4.90226C7.81364 4.52069 7.86174 4.17574 7.9086 3.95127C7.9537 3.73521 8.03211 3.48608 8.10088 3.26315L10.3942 3.97067ZM10.2261 4.20382C10.1899 4.08456 10.1116 3.9825 10.0058 3.91665L8.73778 5.95432C8.34953 5.71271 8.06228 5.33826 7.92951 4.90068L10.2261 4.20382ZM9.79294 3.81181C9.9182 3.85876 10.0531 3.87405 10.1857 3.85632L10.5038 6.23515C9.9795 6.30525 9.446 6.2448 8.95067 6.05916L9.79294 3.81181ZM10.3448 3.84573H10.6274V6.24573H10.3448V3.84573ZM10.6274 3.84573C11.4918 3.84573 12.2614 3.84321 12.8617 3.92259C13.4708 4.00313 14.1848 4.19854 14.6884 4.82846L12.8137 6.32697C12.892 6.42491 12.9437 6.35432 12.547 6.30187C12.1415 6.24825 11.5619 6.24573 10.6274 6.24573V3.84573ZM14.6912 4.83206C14.7807 4.94488 14.8607 5.06488 14.9304 5.19085L12.8306 6.35306C12.8248 6.34263 12.8182 6.3327 12.8108 6.32336L14.6912 4.83206ZM14.9313 5.19235C15.3295 5.91423 15.2149 6.65558 15.0357 7.24199C14.8606 7.81505 14.5373 8.50488 14.1815 9.27135L12.0046 8.26086C12.3917 7.42701 12.6257 6.91638 12.7404 6.54076C12.8511 6.17848 12.7588 6.22292 12.8298 6.35157L14.9313 5.19235ZM14.1815 9.2714C13.8506 9.98412 13.5664 10.5991 13.2786 11.0843C12.9773 11.5924 12.6251 12.0428 12.1128 12.3921L10.7607 10.4092C10.881 10.3272 11.0161 10.1943 11.2144 9.86004C11.4262 9.50285 11.6539 9.01629 12.0046 8.26081L14.1815 9.2714ZM12.1154 12.3903C12.0282 12.4501 11.9388 12.5064 11.8471 12.5592L10.6483 10.4801C10.6862 10.4582 10.7228 10.4352 10.7581 10.411L12.1154 12.3903ZM11.8437 12.5612C11.3089 12.8672 10.7505 12.9912 10.1596 13.0479C9.59275 13.1024 8.90618 13.1011 8.1031 13.1011V10.7011C8.95196 10.7011 9.50434 10.6998 9.93011 10.6589C10.3319 10.6203 10.5198 10.5536 10.6518 10.4781L11.8437 12.5612ZM8.1031 13.1011H7.74523V10.7011H8.1031V13.1011ZM7.74523 13.1011C6.77715 13.1011 5.93436 13.1035 5.26083 13.0158C4.5565 12.9241 3.859 12.7153 3.28664 12.1615L4.95557 10.4368C5.00532 10.4849 5.11892 10.5771 5.57064 10.6359C6.05316 10.6987 6.71138 10.7011 7.74523 10.7011V13.1011ZM3.28664 12.1615C2.70775 11.6013 2.48534 10.9082 2.38853 10.2083C2.29696 9.54642 2.29988 8.72085 2.29988 7.78789H4.69988C4.69988 8.79123 4.70237 9.4203 4.76588 9.87945C4.82416 10.3007 4.91236 10.395 4.95557 10.4368L3.28664 12.1615ZM2.29988 7.78789V7.10629H4.69988V7.78789H2.29988ZM2.30457 7.21225C2.23249 6.3992 2.30653 5.57982 2.52316 4.79287L4.83709 5.42984C4.69646 5.94068 4.64841 6.47256 4.69519 7.00033L2.30457 7.21225ZM2.61078 4.56684C2.98329 3.83528 3.48127 3.17476 4.08207 2.61532L5.71759 4.37175C5.32226 4.73987 4.99459 5.1745 4.74947 5.65587L2.61078 4.56684ZM4.00927 2.68923L6.87305 -0.481659L8.65417 1.12695L5.79039 4.29784L4.00927 2.68923ZM6.85159 -0.457238C6.92344 -0.541271 6.99975 -0.621395 7.08018 -0.697265L8.72702 1.04857C8.70894 1.06562 8.69178 1.08364 8.67563 1.10253L6.85159 -0.457238ZM7.11945 -0.732704C7.50037 -1.06154 7.99504 -1.22793 8.49726 -1.19616L8.34574 1.19905C8.47041 1.20694 8.5932 1.16563 8.68775 1.08401L7.11945 -0.732704ZM8.49726 -1.19616C8.99948 -1.16439 9.46923 -0.936995 9.80568 -0.562778L8.02095 1.04183C8.10447 1.13472 8.22108 1.19116 8.34574 1.19905L8.49726 -1.19616ZM9.84524 -0.516464C9.91434 -0.431279 9.97891 -0.342508 10.0387 -0.250519L8.02597 1.0568C8.0122 1.0356 7.99732 1.01514 7.98139 0.995511L9.84524 -0.516464ZM10.0148 -0.285868C10.089 -0.180055 10.1607 -0.0723137 10.2299 0.0373305L8.20044 1.31844C8.15183 1.24142 8.10162 1.166 8.04983 1.09215L10.0148 -0.285868ZM10.2394 0.052542C10.505 0.48767 10.6819 0.97112 10.7597 1.47497L8.3878 1.84122C8.35837 1.65065 8.29149 1.4678 8.191 1.30322L10.2394 0.052542ZM10.7597 1.47497C10.8375 1.97883 10.8147 2.4931 10.6926 2.9881L8.36244 2.41352C8.40861 2.2263 8.41723 2.03179 8.3878 1.84122L10.7597 1.47497ZM10.6875 3.00841C10.6536 3.13608 10.6162 3.26253 10.5751 3.38772L8.29446 2.64038C8.3211 2.55908 8.3455 2.47671 8.36764 2.39321L10.6875 3.00841Z" fill="#292D32" mask="url(#path-1-inside-1_414_2280)"/>
            </g>
          </svg>

          <!--- <img class="r-icon" src="../static/newlogos/hugeicons--thumbs-up.svg" alt="" srcset=""> -->
        </div>
        <div class="utility-icons  rbtn1" id=negativeres${div_counter}>
          <svg width="18" height="18" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <title>Negative</title>
            <g id="hugeicons--thumbs-down">
            <mask id="path-1-inside-1_414_2281" fill="white">
            <path d="M14 5.69956C14 6.07085 13.8525 6.42693 13.59 6.68948C13.3274 6.95202 12.9713 7.09951 12.6 7.09951C12.0431 7.09951 11.509 6.87827 11.1152 6.48446C10.7214 6.09064 10.5001 5.55652 10.5001 4.99958V2.19968C10.5001 1.64275 10.7214 1.10862 11.1152 0.714808C11.509 0.320995 12.0431 0.0997534 12.6 0.0997534C12.9713 0.0997534 13.3274 0.247249 13.59 0.50979C13.8525 0.772332 14 1.12842 14 1.49971V5.69956ZM4.5652 8.98507L4.75244 8.38309C4.90469 7.88961 4.98169 7.64287 4.92219 7.44775C4.87389 7.28859 4.76942 7.15239 4.6282 7.06451C4.3179 6.94822 3.98368 6.91035 3.65523 6.95427H3.37262C1.57368 6.95427 0.674209 6.95427 0.248974 6.42229C0.200538 6.36121 0.157226 6.29624 0.119478 6.22804C-0.20776 5.63481 0.164102 4.83422 0.906951 3.2339C1.58855 1.7657 1.93067 1.03072 2.56327 0.599361C2.62452 0.557364 2.68751 0.517696 2.75226 0.480365C3.41899 0.0988779 4.24496 0.0988789 5.8969 0.0988789H6.25477C8.2567 0.0988789 9.25679 0.0988789 9.87889 0.700858C10.501 1.30284 10.5001 2.2758 10.5001 4.21211V4.89371C10.5595 5.56412 10.4985 6.23975 10.3199 6.88864C10.0111 7.49511 9.59824 8.04268 9.10017 8.50646L6.23639 11.6774C6.19239 11.7288 6.14565 11.7779 6.0964 11.8243C5.95321 11.948 5.76728 12.0105 5.5785 11.9986C5.38972 11.9866 5.21315 11.9011 5.08668 11.7605C5.04417 11.7081 5.00445 11.6535 4.96769 11.5969C4.90469 11.507 4.84373 11.4154 4.78482 11.3221C4.60174 11.0223 4.47987 10.6891 4.42625 10.3419C4.37264 9.99469 4.38834 9.6403 4.47245 9.29919C4.50045 9.19361 4.53137 9.08919 4.5652 8.98595"/>
            </mask>
            <path d="M12.6 0.0997534V-1.10025V0.0997534ZM14 1.49971H15.2H14ZM5.71105 9.34149C5.51421 9.97432 4.84162 10.3278 4.20879 10.1309C3.57595 9.93408 3.22251 9.26149 3.41935 8.62866L5.71105 9.34149ZM4.75244 8.38309L5.89912 8.73685L5.89829 8.73951L4.75244 8.38309ZM4.92219 7.44775L3.77437 7.79776L3.77389 7.79618L4.92219 7.44775ZM4.6282 7.06451L5.04933 5.94084C5.12358 5.96867 5.19489 6.00378 5.26222 6.04568L4.6282 7.06451ZM3.65523 6.95427L3.81427 8.14368C3.76155 8.15073 3.70842 8.15427 3.65523 8.15427V6.95427ZM0.248974 6.42229L-0.688376 7.17155L-0.691242 7.16794L0.248974 6.42229ZM0.119478 6.22804L-0.930436 6.80915L-0.93126 6.80765L0.119478 6.22804ZM0.906951 3.2339L-0.1815 2.72865L-0.181477 2.7286L0.906951 3.2339ZM2.56327 0.599361L3.24191 1.58904L3.23932 1.59081L2.56327 0.599361ZM2.75226 0.480365L2.15286 -0.559219L2.15631 -0.561191L2.75226 0.480365ZM10.5001 4.89371L9.30481 4.99967C9.30168 4.96444 9.30012 4.92908 9.30012 4.89371H10.5001ZM10.3199 6.88864L11.4768 7.20713C11.4553 7.28524 11.426 7.36097 11.3892 7.43316L10.3199 6.88864ZM9.10017 8.50646L8.20961 7.70216C8.2328 7.67648 8.25709 7.65182 8.28241 7.62825L9.10017 8.50646ZM6.23639 11.6774L5.32437 10.8975C5.33142 10.8892 5.33857 10.8811 5.34583 10.8731L6.23639 11.6774ZM6.0964 11.8243L6.91982 12.6973C6.90699 12.7094 6.8939 12.7212 6.88055 12.7327L6.0964 11.8243ZM5.08668 11.7605L4.19432 12.5628C4.18074 12.5477 4.16755 12.5322 4.15476 12.5165L5.08668 11.7605ZM4.96769 11.5969L5.95017 10.9078C5.95833 10.9195 5.96628 10.9313 5.97403 10.9432L4.96769 11.5969ZM4.78482 11.3221L3.77008 11.9627C3.76689 11.9576 3.76375 11.9526 3.76064 11.9475L4.78482 11.3221ZM4.47245 9.29919L3.30735 9.0119C3.30902 9.00511 3.31076 8.99834 3.31255 8.99159L4.47245 9.29919ZM3.42486 8.61228C3.63123 7.98249 4.30908 7.63924 4.93887 7.84561C5.56866 8.05198 5.91191 8.72983 5.70554 9.35962L3.42486 8.61228ZM15.2 5.69956C15.2 6.38911 14.9261 7.05042 14.4385 7.538L12.7414 5.84095C12.7789 5.80345 12.8 5.75259 12.8 5.69956H15.2ZM14.4385 7.538C13.9509 8.02559 13.2896 8.29951 12.6 8.29951V5.89951C12.6531 5.89951 12.7039 5.87845 12.7414 5.84095L14.4385 7.538ZM12.6 8.29951C11.7249 8.29951 10.8855 7.95184 10.2666 7.33299L11.9637 5.63593C12.1325 5.8047 12.3614 5.89951 12.6 5.89951V8.29951ZM10.2666 7.33299C9.64779 6.71413 9.30012 5.87478 9.30012 4.99958H11.7001C11.7001 5.23826 11.7949 5.46716 11.9637 5.63593L10.2666 7.33299ZM9.30012 4.99958V2.19968H11.7001V4.99958H9.30012ZM9.30012 2.19968C9.30012 1.32449 9.64779 0.485136 10.2666 -0.13372L11.9637 1.56334C11.7949 1.73211 11.7001 1.96101 11.7001 2.19968H9.30012ZM10.2666 -0.13372C10.8855 -0.752577 11.7249 -1.10025 12.6 -1.10025V1.29975C12.3614 1.29975 12.1325 1.39457 11.9637 1.56334L10.2666 -0.13372ZM12.6 -1.10025C13.2896 -1.10025 13.9509 -0.826323 14.4385 -0.338738L12.7414 1.35832C12.7039 1.32082 12.6531 1.29975 12.6 1.29975V-1.10025ZM14.4385 -0.338738C14.9261 0.148847 15.2 0.810154 15.2 1.49971H12.8C12.8 1.44668 12.7789 1.39582 12.7414 1.35832L14.4385 -0.338738ZM15.2 1.49971V5.69956H12.8V1.49971H15.2ZM3.41935 8.62866L3.6066 8.02668L5.89829 8.73951L5.71105 9.34149L3.41935 8.62866ZM3.60577 8.02933C3.6449 7.90252 3.67479 7.80567 3.69899 7.72218C3.72327 7.63836 3.73572 7.58863 3.74204 7.55834C3.75687 7.48729 3.71751 7.61131 3.77437 7.79776L6.07001 7.09774C6.18636 7.47931 6.13826 7.82426 6.0914 8.04873C6.0463 8.26479 5.96789 8.51392 5.89912 8.73685L3.60577 8.02933ZM3.77389 7.79618C3.81007 7.91544 3.88836 8.0175 3.99418 8.08335L5.26222 6.04568C5.65047 6.28729 5.93772 6.66174 6.07049 7.09932L3.77389 7.79618ZM4.20706 8.18819C4.0818 8.14124 3.94687 8.12595 3.81427 8.14368L3.49619 5.76485C4.0205 5.69475 4.554 5.7552 5.04933 5.94084L4.20706 8.18819ZM3.65523 8.15427H3.37262V5.75427H3.65523V8.15427ZM3.37262 8.15427C2.50823 8.15427 1.73859 8.15679 1.13835 8.07741C0.529225 7.99687 -0.184849 7.80146 -0.688369 7.17154L1.18632 5.67303C1.10803 5.57509 1.05631 5.64568 1.45296 5.69813C1.8585 5.75175 2.43807 5.75427 3.37262 5.75427V8.15427ZM-0.691242 7.16794C-0.780709 7.05512 -0.860712 6.93512 -0.930435 6.80915L1.16939 5.64694C1.17516 5.65737 1.18179 5.6673 1.18919 5.67664L-0.691242 7.16794ZM-0.93126 6.80765C-1.32947 6.08577 -1.21486 5.34442 -1.0357 4.75801C-0.860628 4.18495 -0.537286 3.49512 -0.1815 2.72865L1.9954 3.73914C1.60834 4.57299 1.37433 5.08362 1.25957 5.45924C1.14889 5.82152 1.24118 5.77708 1.17022 5.64843L-0.93126 6.80765ZM-0.181477 2.7286C0.149399 2.01588 0.433602 1.40085 0.721361 0.915669C1.0227 0.407595 1.37492 -0.0427504 1.88722 -0.392082L3.23932 1.59081C3.11902 1.67283 2.98388 1.80566 2.78561 2.13996C2.57376 2.49715 2.34611 2.98371 1.99538 3.73919L-0.181477 2.7286ZM1.88464 -0.390313C1.97179 -0.450076 2.06123 -0.506378 2.15287 -0.559214L3.35166 1.51994C3.3138 1.54177 3.27724 1.5648 3.2419 1.58904L1.88464 -0.390313ZM2.15631 -0.561191C2.6911 -0.867186 3.24946 -0.991163 3.84036 -1.04794C4.40725 -1.1024 5.09382 -1.10112 5.8969 -1.10112V1.29888C5.04804 1.29888 4.49566 1.30016 4.06989 1.34106C3.66814 1.37966 3.48016 1.44643 3.34822 1.52192L2.15631 -0.561191ZM5.8969 -1.10112H6.25477V1.29888H5.8969V-1.10112ZM6.25477 -1.10112C7.22285 -1.10112 8.06564 -1.10351 8.73917 -1.01583C9.4435 -0.924145 10.141 -0.715344 10.7134 -0.161504L9.04443 1.56322C8.99468 1.51508 8.88108 1.42289 8.42936 1.36409C7.94684 1.30127 7.28862 1.29888 6.25477 1.29888V-1.10112ZM10.7134 -0.161504C11.2922 0.398662 11.5147 1.09183 11.6115 1.79167C11.703 2.45358 11.7001 3.27915 11.7001 4.21211H9.30012C9.30012 3.20877 9.29763 2.5797 9.23412 2.12055C9.17584 1.69934 9.08764 1.60503 9.04443 1.56322L10.7134 -0.161504ZM11.7001 4.21211V4.89371H9.30012V4.21211H11.7001ZM11.6954 4.78775C11.7675 5.6008 11.6935 6.42018 11.4768 7.20713L9.16291 6.57016C9.30354 6.05932 9.35159 5.52744 9.30481 4.99967L11.6954 4.78775ZM11.3892 7.43316C11.0167 8.16472 10.5187 8.82524 9.91793 9.38468L8.28241 7.62825C8.67774 7.26013 9.00541 6.8255 9.25053 6.34413L11.3892 7.43316ZM9.99073 9.31077L7.12695 12.4817L5.34583 10.8731L8.20961 7.70216L9.99073 9.31077ZM7.14841 12.4572C7.07656 12.5413 7.00025 12.6214 6.91982 12.6973L5.27298 10.9514C5.29106 10.9344 5.30822 10.9164 5.32437 10.8975L7.14841 12.4572ZM6.88055 12.7327C6.49963 13.0615 6.00496 13.2279 5.50274 13.1962L5.65426 10.801C5.52959 10.7931 5.4068 10.8344 5.31225 10.916L6.88055 12.7327ZM5.50274 13.1962C5.00052 13.1644 4.53077 12.937 4.19432 12.5628L5.97905 10.9582C5.89553 10.8653 5.77892 10.8088 5.65426 10.801L5.50274 13.1962ZM4.15476 12.5165C4.08566 12.4313 4.02109 12.3425 3.96134 12.2505L5.97403 10.9432C5.9878 10.9644 6.00268 10.9849 6.01861 11.0045L4.15476 12.5165ZM3.98521 12.2859C3.911 12.1801 3.83929 12.0723 3.77008 11.9627L5.79956 10.6816C5.84817 10.7586 5.89838 10.834 5.95017 10.9078L3.98521 12.2859ZM3.76064 11.9475C3.49496 11.5123 3.31811 11.0289 3.24031 10.525L5.6122 10.1588C5.64163 10.3493 5.70851 10.5322 5.809 10.6968L3.76064 11.9475ZM3.24031 10.525C3.16251 10.0212 3.18529 9.5069 3.30735 9.0119L5.63756 9.58648C5.59139 9.7737 5.58277 9.96821 5.6122 10.1588L3.24031 10.525ZM3.31255 8.99159C3.3464 8.86392 3.38384 8.73747 3.42486 8.61228L5.70554 9.35962C5.6789 9.44092 5.6545 9.52329 5.63236 9.60679L3.31255 8.99159Z" fill="#292D32" mask="url(#path-1-inside-1_414_2281)"/>
            </g>
          </svg>

          <!---   <img class="r-icon" src="../static/newlogos/hugeicons--thumbs-down.svg" alt="" srcset="">  -->
        </div>
        <div class="r-alert" style="font-size:11px;"></div>
    </div>
`);
var val1="postiveres"+div_counter
var val2="negativeres"+div_counter
var val3="copytext"+div_counter
var val4="favourite"+div_counter
document.getElementById(val1).addEventListener("click", function() {
    logdata['responsetype']='positive'
    positivefeedback(this, logdata);
});
document.getElementById(val2).addEventListener("click", function() {
    logdata['responsetype']='negative'
    negativefeedback(this, logdata);
});
document.getElementById(val3).addEventListener("click", function() {
    copytext(this, data['response']);
});
document.getElementById(val4).addEventListener("click", function() {
    append_favourite(this, data['rdata']);
});
// var val3="downloadfulldata"+div_counter
// document.getElementById(val3).addEventListener("click", function() {
//     console.log(data['jsontable']);
//     const csvContent = jsonToCsv(data['jsontable']);
//     downloadCsv(csvContent, 'data.csv');
// });
    
   div_counter+=1
   var scrolldiv = document.getElementById("chatbox-main-ul");
   scrolldiv.scrollTop = scrolldiv.scrollHeight;
}




function appendCodeToChatbox(code) {
    const chatbox = document.getElementById(`last-code${(div_counter-1)}`);
    const codeElement = document.createElement('pre');
    codeElement.classList.add('language-python'); 
    const codeContent = document.createElement('code');
    codeContent.textContent = code;
    codeElement.appendChild(codeContent);
    chatbox.appendChild(codeElement);
    const button = chatbox.querySelector('button');

    if (button) {
      button.setAttribute('data-clipboard-text', code);
    }
    Prism.highlightElement(codeElement);
  }

function copytext(ele ,val){
   const dataSortValue = val   //ele.getAttribute('data-clipboard-text');
   navigator.clipboard.writeText(dataSortValue)
     .then(() => {
       const alertElement = ele.parentElement.querySelector('.r-alert');
       alertElement.textContent = 'Response copied ...!';
       setTimeout(() => {
           alertElement.textContent = '';
       }, 5000);
     })
     .catch(err => {
       console.error('Failed to copy: ', err);
       const alertElement = ele.parentElement.querySelector('.r-alert');
       alertElement.textContent = 'Response Not copied ...!';
       setTimeout(() => {
           alertElement.textContent = '';
       }, 5000);
     });
}

sendbtn.addEventListener('click',(event)=>{
    event.preventDefault();
    var userinput=textareainp.value.trim()
    getanswer(userinput);
})

textareainp.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent form submission
        var userinput=textareainp.value.trim()
        getanswer(userinput);
    }
});


function selecttblfunc(name){
   // console.log(name);
    $(".history-ul").html('')
    $(".current-selected-table").text(name)
    table_selected=name
    if(currencyFor_Dataproducts.includes(name)){
        $(".configuration").show()
    }else{
         $(".configuration").hide()
    }
    if(graphFor_Dataproducts.includes(name)){
        $("#sliderparentdiv").show()
    }else{
        $("#sliderparentdiv").hide()
    }

    calculateheight()
    const modal = document.getElementById('sopsection-parent');
    if (modal.getAttribute('data-openedby')=="datacatalogue"){
        if (modal.style.display === 'block') {
            opendatacatalogue()
        }
    }
   $(".selecttbl").css('display','none')
   if (history_object.hasOwnProperty(table_selected)) {
    const value = history_object[table_selected];
    //console.log(value);
    appendlist(value,table_selected)
    }

    appendfaq(m_faq[table_selected])
    $(".prev_questionslist").html('')
    
    appendprevious(m_previous_question[table_selected],table_selected)
}

const hoverElement = document.querySelector('.showtablesli-parent');
const hiddenElement = document.querySelector('.selecttbl');

hoverElement.addEventListener('mouseover', () => {
    hiddenElement.style.display = 'block';
});

hoverElement.addEventListener('mouseout', () => {
    hiddenElement.style.display = 'none';
});

function select_curr_func(val){
    // $(".current-selected-currency").text(val)
    currency_selected=val
   // calculateheight()
}


function exportTableToExcel(element) {
   var tableId= element.parentElement.parentElement.parentElement.nextElementSibling.querySelector('table').id;
    const table = document.getElementById(tableId);
    var csvContent = "";
    for (var i = 0; i < table.rows.length; i++) {
        var row = table.rows[i];
        var rowData = [];
        for (var j = 0; j < row.cells.length; j++) {
             if( j!=0){
                rowData.push(row.cells[j].innerText);
             } 
        }
        csvContent += rowData.join(",") + "\n";
    }
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement("a");
    if (link.download !== undefined) {
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", "download.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }

function openmodal(element){
  $(".mymodal").show()
  var masterdata= element.parentElement.parentElement.parentElement.parentElement
  var masterdataHTML = masterdata.innerHTML;
  var tempElement = document.createElement('div');
  tempElement.classList.add('mydataframe-parent');
  tempElement.style.width = 'fit-content';
  tempElement.innerHTML = masterdataHTML;

   var utilityElements = tempElement.querySelectorAll('.modalopener')[0]
    utilityElements.innerHTML=`<button onclick="closemodal(this)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fullscreen-exit" viewBox="0 0 16 16">
                                        <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5m5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5M0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5m10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0z"/>
                                    </svg>
                                </button>`;
  $('.mymodal-content').html(tempElement)
}

function closemodal(element){
    $(".mymodal").hide()
}

function searchtable(element){ 
    var table= element.parentElement.parentElement.parentElement.nextElementSibling.querySelector('table');
    var searchValue=element.value.toLowerCase();
    var rows = table.querySelectorAll('tr');
    var count=0
    rows.forEach(function(row, index) {
        if (index === 0) return; 
        var rowMatches = false;
        var cells = row.querySelectorAll('td');
        cells.forEach(function(cell) {
            var cellValue = cell.textContent.toLowerCase() || cell.innerText.toLowerCase();
            if (cellValue.includes(searchValue)) {
                rowMatches = true; 
            }
        });
       
        if (rowMatches) {
            row.style.display = ''; 
            count++;
        } else {
            row.style.display = 'none'; 
            count--
        }

    })
}


function searchonoff(element){
    var searchtab= element.parentElement.parentElement.nextElementSibling;
    if (searchtab.style.display === 'none' || searchtab.style.display === '') {
        searchtab.style.display = 'block'; // Show the element
    } else {
        searchtab.style.display = 'none'; // Hide the element
    }
}

function togglesvgarrow(element) { 
    const svg = element.querySelector('svg'); 
    const currentRotation = svg.style.transform;
    if (currentRotation === 'rotateZ(360deg)') {
        svg.style.transform = 'rotateZ(180deg)';
    } else {
        svg.style.transform = 'rotateZ(360deg)';
    }
}

function refreshchat(){
    const chatboxMainUl = document.getElementById('chatbox-main-ul');
    if (chatboxMainUl) {
      const firstLi = chatboxMainUl.firstElementChild;
      if (firstLi) {
        const clonedLi = firstLi.cloneNode(true); // Create a deep clone
        chatboxMainUl.innerHTML = ''; // Clear the contents of the chatbox
        chatboxMainUl.appendChild(clonedLi);
      } else {
        console.error("No first li element found.");
      }
    } else {
      console.error("chatbox-main-ul element not found.");
    }
    for (let i = 0; i < sessionStorage.length; i++) {
        // Get the key at index 'i'
        let key = sessionStorage.key(i);
        // Check if the key ends with "__CWD"
        if (key.endsWith("__CWD")) {
            // Set the value of this key to an empty array
            sessionStorage.setItem(key, JSON.stringify([]));
        }
    }
}

function positivefeedback(element, data) {
    sendFeedback(element, data);
}

function negativefeedback(element, data) {
    sendFeedback(element, data);
}

function sendFeedback(element, data) {
    $.ajax({
        url: '/feedbacklogs',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            const clickedSvg = element.querySelector('img');
            // clickedSvg.style.fill = '#02ADCF';
            const allIcons = element.parentElement.querySelectorAll('.r-icon');
            const alldivs = element.parentElement.querySelectorAll('.rbtn1');
            alldivs.forEach(div=>{
                div.style.pointerEvents = 'none';
            })
            allIcons.forEach(img => {
                img.style.pointerEvents = 'none';
                if (img !== clickedSvg) {
                    img.style.opacity = '0.6';
                }
            });
            const alertElement = element.parentElement.querySelector('.r-alert');
            alertElement.textContent = 'Response saved !';
            setTimeout(() => {
                alertElement.textContent = '';
            }, 5000);
        },
        error: function(xhr, status, error) {
            console.log('Error:', error);
        }
    });
}
function sendlogs(data) {
    //console.log("Send Logs-------",data);
    $.ajax({
        url: '/datalogs',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),

           success: function(response) {
            
        },
        error: function(xhr, status, error) {
            console.log('Error:', error);
        }
    });
}


function closesopmodal(){
    $("#sopsection-parent").hide()
}

function opensopguidemodal(){
    $("#sopsection-parent ").show()
    const div = document.getElementById('sopsection-parent');
    div.setAttribute('data-openedby', 'sopguide');
    $("#sopsection-parent ").html(`<div class="mybtn-close" >
                                        <svg id="close-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16" onclick="closesopmodal()">
                                            <title>close</title>
                                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" stroke="currentColor" stroke-width="1" fill="none"/>
                                        </svg>
                                    </div>
                                    <div class="renderpdf-parent">
                                        <div class="displayimg-div">
                                            <img src="/Protected/sopguide/1.jpeg" alt="" srcset="">
                                        </div>
                                        <div class="displayimg-div">
                                            <img src="/Protected/sopguide/2.jpeg" alt="" srcset="">
                                        </div>
                                        <div class="displayimg-div">
                                            <img src="/Protected/sopguide/3.jpeg" alt="" srcset="">
                                        </div>
                                        <div class="displayimg-div">
                                            <img src="/Protected/sopguide/4.jpeg" alt="" srcset="">
                                        </div>
                                        <div class="displayimg-div">
                                            <img src="/Protected/sopguide/5.jpeg" alt="" srcset="">
                                        </div>
                                    </div>`)
}

var currentdata={}

function opendatacatalogue(){
    $("#sopsection-parent").show()
    const div = document.getElementById('sopsection-parent');
    div.setAttribute('data-openedby', 'datacatalogue');
    $("#sopsection-parent").html(``)
    $("#sopsection-parent").html(`<div class="loader-parent" style="display: none;"><span class="sloader"></span></div>`)
    $(".loader-parent").css("display","flex")
    var formdata = new FormData();
    formdata.append('tablename',table_selected)
    $.ajax({
        type: 'POST',
        url: '/getdatacatalogue',
        data: formdata,
        processData: false, 
        contentType: false,
        success: function(response) {
            //console.log(response);
            var tname=Object.keys(response.tableinfo)
            //console.log(tname);
            currentdata=response.tableinfo
            $(".loader-parent").css("display","none")
            if(response.msg == 'success'){ // 
                    var hstr=`<div class="mybtn-close" >
                                        <svg id="close-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16" onclick="closesopmodal()">
                                            <title>close</title>
                                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" stroke="currentColor" stroke-width="1" fill="none"/>
                                        </svg>
                                </div>
                              <div class="data-catalog-title">Data Catalog</div>
                              <div class="boxparent1">
                                    <div class="box1">
                                            <div class="summarybox">
                                                <strong class="dt-title">Summary</strong><br><br>
                                                <p>${response.summary}</p>
                                            </div>
                                    </div>
                              </div> 
                                <div class="boxparent1">
                                    <div class="box1">
                                            <div class="summarybox">
                                                <strong class="dt-title">Data History</strong><br><br>
                                                <p id="datahistory">${response.tableinfo[tname[0]]['info']}</p>
                                            </div>
                                    </div>
                                </div> 
                                <div class="boxparent2" id="datacatalogue-tbl-parent">
                                    <div style="" id="myswitchbtns1">
                                        <div><strong class="dt-title">Data Product :</strong></div>
                                        <div>`
                                        for(let i=0;i<tname.length;i++){
                                           hstr+=`<button  class="switchbtns ${i==0?"active1":"inactive1"}" type="buton" onclick="visibletable(${i},'${tname[i]}',this)">${tname[i]}</button>`
                                        }
                                  hstr+=`</div>
                                    </div>`
                                  for(let i=0;i<tname.length;i++){
                                    hstr+=`<div class="mydataframe-parent  modal-tbls" style="display:${i == 0? "block":"none"}" id="table${i}">
                                                <div class="mydataframe2" style="width: fit-content;">
                                                        <div class="table-utility-parent">
                                                            <div class="table-utility">
                                                                <div>
                                                                    <button kind="elementToolbar" onclick="searchonoff(this)">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                                                                            <title>search</title>
                                                                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"></path>
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div class="mysearchutility" style="display: none;">
                                                                <div>
                                                                    <input type="search" name="" id="" placeholder="Search here..." style="display: block;" oninput="searchtable2(this,'table${i}')">
                                                                </div>
                                                            </div>
                                                        </div>
                                                        ${response.tableinfo[tname[i]]['df']}
                                                </div>  
                                           </div>`
                                    }
                               hstr+=`</div>`
              $("#sopsection-parent ").html(hstr)
              resizedatacatalogue()
            }
            else if (response.msg == 'error'){
                $(".loader-parent").css("display","none")
                $("#sopsection-parent").hide()
                Toast.fire({
                    icon: "error",
                    title: "Internal server error...!"
                  });
            }
        },
        error: function(xhr, status, error) {
            $(".loader-parent").css("display","none")
            $("#sopsection-parent").hide()
          //  console.log('Error:', error);
            Toast.fire({
                icon: "error",
                title: "Internal server error...!"
            });
        }
    });
  
}

function visibletable(no,tname,btn){
  //console.log(no,tname,btn);
  var tid="#table"+no
  $(".modal-tbls").hide()
  $(tid).show()
  $("#datahistory").html(currentdata[tname]['info'])
  var buttons = document.getElementsByClassName('switchbtns');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active1');
        buttons[i].classList.add('inactive1');
    }                           
        btn.classList.remove('inactive1');
        btn.classList.add('active1');
}

function clickcards(element) {
    const questionText = element.querySelector('p').textContent.trim();
    if(questionText != ''){
        $("#sopsection-parent").hide()
        getanswer(questionText);
    }
}


function searchtable2(element,id){
    var ele_id=document.getElementById(id)
    var table= ele_id.querySelector('table');
    var searchValue=element.value.toLowerCase();
    var rows = table.querySelectorAll('tr');
    var count=0
    rows.forEach(function(row, index) {
        if (index === 0) return; // Skip the first row (header)
        // Assume initially that the row does not match the search
        var rowMatches = false;
        // Loop through each cell in the row
        var cells = row.querySelectorAll('td');
        cells.forEach(function(cell) {
            // Check if the cell value matches the search value
            var cellValue = cell.textContent.toLowerCase() || cell.innerText.toLowerCase();
            if (cellValue.includes(searchValue)) {
                rowMatches = true; 
            }
        });
        if (rowMatches) {
            row.style.display = ''; // Show the row
            count++;
        } else {
            row.style.display = 'none'; // Hide the row
            count--
        }
 
    })
}

function addSorting(tableId) {
    const table = document.getElementById(tableId);
    const headers = table.querySelectorAll('thead th');
    headers.forEach((header, index) => { 
        //console.log(header.innerHTML);
        header.style.cursor = 'pointer';
        // const sortIcon = document.createElement('span');
        // sortIcon.classList.add('sort-icon');
        // sortIcon.innerHTML = '  ';
        // header.innerHTML=''
        // header.appendChild(sortIcon);
        // header.innerText +="    ↑↓ "
        header.addEventListener('click', () => {
            sortTable(table, index);
        });
    });
}
 
 
function checkStringfor_onlydigit(s) {
    const hasAlpha = /[a-zA-Z]/.test(s);
    const hasDigit = /\d/.test(s);
    if (hasAlpha && hasDigit) {
        return false;
    } else if (!hasAlpha) {
        return true;
    } else {
        return false;
    }
}
 
function sortTable(table, columnIndex) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isAscending = table.getAttribute('data-sort-order') === 'asc';
    const newOrder = isAscending ? 'desc' : 'asc';
    table.setAttribute('data-sort-order', newOrder);
 
    // Function to detect data type
    function detectDataType(value) {
        //console.log(checkStringfor_onlydigit(value));
        if (value.includes('-') || value.includes(':') || value.includes('/')) {
            if (!isNaN(Date.parse(value))) {
                return 'date';
            }
        }
        if(checkStringfor_onlydigit(value)){
            if (!isNaN(parseFloat(value.replace(/[^0-9.-]+/g,"")))) return 'number'; // Number or currency
        }
 
 
        return 'string'; // Default to string
    }
 
 
    let detectedType;
    for (let row of rows) {
        const cellValue = row.children[columnIndex].innerText.trim();
        if (cellValue !== '') {
            detectedType = detectDataType(cellValue);
            break;
        }
    }
 
    rows.sort((rowA, rowB) => {
        let cellA = rowA.children[columnIndex].innerText.trim();
        let cellB = rowB.children[columnIndex].innerText.trim();
 
        switch (detectedType) {
            case 'number':
                cellA = parseFloat(cellA.replace(/[^0-9.-]+/g,""));
                cellB = parseFloat(cellB.replace(/[^0-9.-]+/g,""));
                return isAscending ? cellA - cellB : cellB - cellA;
 
            case 'date':
                return isAscending 
                    ? new Date(cellA) - new Date(cellB)
                    : new Date(cellB) - new Date(cellA);
 
            default:
                return isAscending 
                    ? cellA.localeCompare(cellB)
                    : cellB.localeCompare(cellA);
        }
    });
    //console.log('detectedType',detectedType);
    rows.forEach(row => tbody.appendChild(row));
}

function calculateheight(){
    const header = document.querySelector('.chatbox-header');
    const headerHeight = header.offsetHeight;
    const remainingHeight = window.innerHeight - headerHeight - 5;
    const contentDiv = document.querySelector('#sopsection-parent');
    contentDiv.style.height = `${remainingHeight}px`;
}

calculateheight()

function attachSortingFeature(tableId) {
    var table_header="#"+ tableId +" thead" +" th"
    document.querySelectorAll(table_header).forEach((headerCell, index) => {
        headerCell.addEventListener('click', () => sortTable(document.getElementById(tableId), index));
    });
}

function detectDataType(value) {
    if (!isNaN(Date.parse(value))) return 'date';
    if (!isNaN(parseFloat(value.replace(/,/g, '')))) return 'number';
    return 'string';
}

function appendToSessionStorage(key, value) {
    key=key + "__CWD"
   // console.log(key, value);
    // Retrieve the existing array
    let existingArray = JSON.parse(sessionStorage.getItem(key));
    // Append the new value
    existingArray.push(value);
    // Store the updated array back in sessionStorage
    sessionStorage.setItem(key, JSON.stringify(existingArray));
}

// function jsonToCsv(jsonData) {
//     const headers = Object.keys(jsonData);
//     const rows = Object.keys(jsonData[headers[0]]).map(index => {
//         return headers.map(header => {
//             let value = jsonData[header][index];
//             if (header.includes('Date_Only')) {
//                 value = new Date(value).toLocaleDateString('en-GB'); // Format date as DD/MM/YYYY
//             } else if (header.includes('Datetime')) {
//                 value = new Date(value).toLocaleString('en-GB'); // Format datetime as DD/MM/YYYY, HH:MM:SS
//             }
//             return `"${value}"`; // Enclose in quotes to handle commas in values
//         }).join(',');
//     });
 
//     const csvContent = [headers.join(','), ...rows].join('\n');
//     return csvContent;
// }
 
// function downloadCsv(csvContent, filename) {
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     if (link.download !== undefined) {
//         const url = URL.createObjectURL(blob);
//         link.setAttribute('href', url);
//         link.setAttribute('download', filename);
//         link.style.visibility = 'hidden';
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     }
// }
 
function resizedatacatalogue(){
    var elementWidth2 = $('.boxparent2').innerWidth();
    var value2 = (elementWidth2 - 20);
    var viewportWidth = $(window).width();
    var value2VW = (value2 / viewportWidth) * 100 + "vw";
    var vinpx2=value2+"px"
    // if (value2 > 900) {
    //     vinpx2 = "55vw";
    // }
    if(elementWidth2 != undefined){
        $(".mydataframe2 table").css("max-width", vinpx2);
    }
    // console.log(value2,"max-width2", "90%");
}
 
 
function resizedivs(){
    calculateheight()
    resizedatacatalogue()
}

$(window).resize(resizedivs);
 
document.getElementById('textareainp').addEventListener('input', function() {
    var text = this.value.trim();
    if (text.length >= 501) {
        this.value = text.slice(0, 501);
        $("#inputalert").show()
        $(".textarea-parent").css('border-color','#f83b46')
        // $("#sendbtn").hide()
        // $("#processbtn").show()
    }else{
        $("#inputalert").hide()
        $(".textarea-parent").css('border-color','lightgray')
        // $("#sendbtn").show()
        // $("#processbtn").hide()
    }
});

function getgraphvalue(checkbox){
    // var gtitle=document.getElementById('g-toggle')
    if( checkbox.checked === false){
        is_graph=false
        // gtitle.title="Graphs are DISABLED"
    }else if(checkbox.checked === true){
        is_graph=true
        // gtitle.title="Graph are ENABLED"
    }
}


function selectexperience(button){
    if (button.classList.contains("selectedbt0")) {
        button.classList.remove("selectedbt0");
        button.classList.add("selectedbt1");
        experience=true;
    } else if (button.classList.contains("selectedbt1")) {
        button.classList.remove("selectedbt1");
        button.classList.add("selectedbt0");
        experience=false;
    }
    // console.log('experience',experience);
}

function selectexperience1(button){
    if (button.classList.contains("selectedbt0")) {
        button.classList.remove("selectedbt0");
        button.classList.add("selectedbt1");
        exclude_experience=true;
    } else if (button.classList.contains("selectedbt1")) {
        button.classList.remove("selectedbt1");
        button.classList.add("selectedbt0");
        exclude_experience=false;
    }
    // console.log('exclude_experience',exclude_experience);
}

document.getElementById('togglesidebar').addEventListener('click', function() {
    var svg1 = document.getElementById('svg1');
    var svg2 = document.getElementById('svg2');
    var sidepan=document.getElementById('sidepan')
    
    // if (svg1.classList.contains('dsp-none')) {
    //   // Perform action if svg1 has the class
    //   console.log('svg1 has the dsp-none class');
    //   // Add your calculation or action here
      
    // } else {
    //   // Perform action if svg2 has the class
    //   console.log('svg2 has the dsp-none class');
    //   // Add your calculation or action here
      
    // }
    svg1.classList.toggle('dsp-none');
    svg2.classList.toggle('dsp-none');
    sidepan.classList.toggle('hidesidebar')
  });

  function showall_accounts(ele){
    getanswer('show my accounts')
  }

//   document.getElementById('search_history').addEventListener('input', function() {
    // let filter = this.value.toLowerCase();
    // let liElements = document.querySelectorAll('.history-li');

    // liElements.forEach(function(li) {
    //     let title = li.querySelector('.li-question').getAttribute('title').toLowerCase();
    //     if (title.includes(filter) || filter === '') {
    //         li.style.display = 'flex';
    //     } else {
    //         li.style.display = 'none';
    //     }
    // });
//     const searchValue = this.value.toLowerCase();
//             const listItems = document.querySelectorAll('.history-ul .history-li');
 
//     listItems.forEach((li) => {
//         const question = li.querySelector('.li-question').textContent.toLowerCase();
//         const borderLi = li.nextElementSibling;
 
//         if (question.includes(searchValue)) {
//             li.style.display = 'flex';
//             if (borderLi && borderLi.classList.contains('border-li')) {
//                 borderLi.style.display = 'block';
//             }
//         } else {
//             li.style.display = 'none';
//             if (borderLi && borderLi.classList.contains('border-li')) {
//                 borderLi.style.display = 'none';
//             }
//         }
//     });
// });

function toggle_historybar(ele){
    var logo=document.getElementById('logo2')
    logo.classList.toggle('hidelogoimg');
    const element = document.getElementById('lwing');
    const element2 = document.getElementById('rwing');
    // if (element.classList.contains('lshow')) {
    //     element.classList.remove('lshow');
    //     element.classList.add('lhide');
    //     element2.classList.remove('rshow');
    //     element2.classList.add('rhide');
    // } else {
    //     element.classList.remove('lhide');
    //     element.classList.add('lshow');
    //     element2.classList.remove('rhide');
    //     element2.classList.add('rshow');
    // }
    element.classList.toggle('lefttoggle');
    element2.classList.toggle('righttoggle');
}

function deletehistory(element,id){
    var loadersvg=element.querySelector(".loadersvg")
    var deletesvg=element.querySelector(".deletesvg")
    loadersvg.style.display='block'
    deletesvg.style.display='none'
    $.ajax({
        url: 'deletequestion/' + id,
        type: 'DELETE',
        success: function(res) {
            if(res.msg =='success'){
                var product=element.getAttribute('data-product')
                // console.log(history_object[product]);
                history_object[product] = history_object[product].filter(item => item[0] != id);
                // console.log(history_object[product]);
                var currentLi = $(element).closest('li');
                var nextLi = currentLi.next('li');
                currentLi.remove();
                nextLi.remove();
                appendlist([],product)
            }else{
                loadersvg.style.display='none'
                deletesvg.style.display='block'
                Toast.fire({
                    icon: "error",
                    title: "Error while deleting question...!"
                  });
            }
        },
        error: function(xhr, status, error) {
            loadersvg.style.display='none'
            deletesvg.style.display='block'
            console.error('Error deleting history:', error);
            Toast.fire({
                icon: "error",
                title: "Error while deleting question...!"
              });
        }
    });
}

function append_favourite(element,mdata){
    // console.log(mdata);
    let dt_product=mdata.data_product
    // console.log('history_object',history_object);
    // console.log('dt_product',history_object[dt_product]);
    if(history_object[dt_product].length<4){
        element.style.pointerEvents = 'none';
        var loadersvg=element.querySelector(".loadersvg")
        var marksvg=element.querySelector(".marksvg")
        loadersvg.style.display='block'
        marksvg.style.display='none'
        $.ajax({
            url: '/insertquestion',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(mdata),
            success: function(res) {
                if(res.msg =='success'){
                    element.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 14 20.004">
                                            <title>Marked as favourite</title>
                                            <path id="bookmark" d="M16,2H8A3,3,0,0,0,5,5V21a1,1,0,0,0,1.5.87L12,18.69l5.5,3.18A1,1,0,0,0,19,21V5a3,3,0,0,0-3-3m1,17.27-4.5-2.6a1,1,0,0,0-1,0L7,19.27V5A1,1,0,0,1,8,4h8a1,1,0,0,1,1,1Z" transform="translate(-5 -2)" fill="#00aed0"/>
                                        </svg>`
                   
                const alertElement = element.parentElement.querySelector('.r-alert');
                alertElement.textContent = 'Marked as favourite !';
                // console.log(res.dbdata);
                // console.log(history_object[res.dbdata.dataproduct]);
                if(history_object[res.dbdata.dataproduct].length == 0 && res.dbdata.dataproduct == table_selected){ 
                    $(".history-ul").html('')
                }
             
                history_object[res.dbdata.dataproduct].push([res.dbdata.qid,mdata.question])
                // console.log(history_object[res.dbdata.dataproduct]);
                if(res.dbdata.dataproduct == table_selected){
                    appendlist([[res.dbdata.qid,mdata.question]],res.dbdata.dataproduct)
                }
                setTimeout(() => {
                    alertElement.textContent = '';
                }, 5000);
                }else{
                    loadersvg.style.display='None'
                    marksvg.style.display='block'
                    // console.log(res);
                    element.style.pointerEvents = 'auto';
                    const alertElement = element.parentElement.querySelector('.r-alert');
                    alertElement.textContent = 'Error while Marking as favourite !';
                    setTimeout(() => {
                        alertElement.textContent = '';
                    }, 5000);
                }
            },
            error: function(xhr, status, error) {
                loadersvg.style.display='none'
                marksvg.style.display='block'
                element.style.pointerEvents = 'auto';
                console.error('Error:', error);
                const alertElement = element.parentElement.querySelector('.r-alert');
                    alertElement.textContent = 'Error while Marking as favourite !';
                    setTimeout(() => {
                        alertElement.textContent = '';
                    }, 5000);
            }
        });
    }else{
        const alertElement = element.parentElement.querySelector('.r-alert');
        alertElement.textContent = 'Already four question marked as favourite !';
        setTimeout(() => {
            alertElement.textContent = '';
        }, 5000);
    }
    
}

function answer_favourite(element,id){
    var question=element.getAttribute('title')
    getanswer(question,id)
}

function answer_leftbar_questions(question){
    getanswer(question)
}
